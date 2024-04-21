import dotenv from "dotenv";
import { StreamingTextResponse, LangChainStream } from "ai";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { nanoid } from 'nanoid'

import axios from "axios";

import { decode } from 'base64-arraybuffer'
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database

dotenv.config({ path: `.env` });

const generateImage = async (prompt: string) => {
  const supabase = createClient(`${process.env.SUPABASE_URL}`, `${process.env.SUPABASE_SERVICE_ROLE_SECRET}`)
  console.log('current prompt inside generateImage func', prompt)
  // throw new Error("Image generation not enabled")
  console.log("Image generation not enabled")
  return null
  try {
    const response = await axios.post(`https://api.runpod.ai/v2/${process.env.RUNPOD_API_ID}/runsync`, {
      input: {
        prompt: prompt
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
      }
    })

    const image = response.data.output.images[0]
    console.log(image.length)

    const { data, error } = await supabase
      .storage
      .from('gen-images')
      .upload(`public/ai-mind-gen-${nanoid()}.png`, decode(image), {
        contentType: 'image/png'
      })
    if (error) {
      console.log('error', error)
      return undefined
    }
    console.log(data)
    // @ts-ignore
    const publicPath = `${process.env.SUPABASE_URL}/storage/v1/object/public/${data.fullPath}`
    console.log(publicPath)

    // return image
    return publicPath

  } catch (error) {
    console.error('Error:', error);
    return undefined;
  }
}


export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const req = await request.json()
    const prompt = req.prompt;
    const user = await currentUser();
    console.log('user propmt', prompt)
    if (!user || !user.firstName || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const identifier = request.url + "-" + user.id;
    const { success } = await rateLimit(identifier);

    if (!success) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }

    // Get current user's subscription status
    const subscription = await prismadb.userSubscription.findFirst({
      where: {
        userId: user.id,
      },
    });
    console.log('subscription', subscription)
    let isPro = false;
    if (subscription && subscription.stripeCurrentPeriodEnd) {
      // Convert stripe_current_period_end to a Date object
      const periodEndDate = new Date(subscription.stripeCurrentPeriodEnd);
      const currentDate = new Date();

      // Check if the current date is before the period end date
      isPro = currentDate < periodEndDate;
    }
    console.log('isPro from server side', isPro)

    const mind = await prismadb.mind.update({
      where: {
        id: params.chatId
      },
      data: {
        messages: {
          create: {
            content: prompt,
            role: "user",
            // User's input is always text
            type: "text",
            userId: user.id,
          },
        },
      }
    });

    if (!mind) {
      return new NextResponse("Mind not found", { status: 404 });
    }

    const numberOfChat = await prismadb.message.count({
      where: {
        userId: user.id
      }
    })

    console.log(`current user has ${numberOfChat} messages`)
    if (numberOfChat >= 4 && !isPro) {
      var Readable = require("stream").Readable;
      let s = new Readable();
      let response = "Want More? Just Subscribe to Pro! Non-paid user can only send 2 messages"
      s.push(response);
      s.push(null);

      await prismadb.mind.update({
        where: {
          id: params.chatId
        },
        data: {
          messages: {
            create: {
              content: response.trim(),
              role: "system",
              type: "text",
              userId: user.id,
            },
          },
        }
      });

      return new StreamingTextResponse(s);
    }


    // Check user requested type
    let type = prompt.includes("send") ? "image" : "text";
    console.log('user requested type', type)

    // Start query
    const name = mind.id;

    const mindKey = {
      mindName: name!,
      userId: user.id,
      // TODO: check this
      modelName: "gemini",
    };
    const memoryManager = await MemoryManager.getInstance();

    const records = await memoryManager.readLatestHistory(mindKey);
    if (records.length === 0) {
      await memoryManager.seedChatHistory(mind.seed, "\n\n", mindKey);
    }
    await memoryManager.writeToHistory("User: " + prompt + "\n", mindKey);

    const recentChatHistory = await memoryManager.readLatestHistory(mindKey);

    // TODO: check memory.ts
    let relevantHistory = "";

    if (type == "image") {
      // call openai image generation api, get the result, which should be base64 and stream it out.
      if (!isPro) {
        var Readable = require("stream").Readable;
        let s = new Readable();
        s.push("Only paid user could generate images")
        s.push(null)
        return new StreamingTextResponse(s);
      }
      const image: any = await generateImage(prompt)
      var Readable = require("stream").Readable;
      let s = new Readable();

      if (image) {
        s.push(image);
        s.push(null);
        await prismadb.mind.update({
          where: {
            id: params.chatId
          },
          data: {
            messages: {
              create: {
                content: image,
                role: "system",
                type: "image",
                userId: user.id,
              },
            },
          }
        });
        return new StreamingTextResponse(s);
      }
      else {
        let errorContent = "Error when generating images"
        s.push(errorContent);
        s.push(null);
        await prismadb.mind.update({
          where: {
            id: params.chatId
          },
          data: {
            messages: {
              create: {
                content: errorContent,
                role: "system",
                type: "text",
                userId: user.id,
              },
            },
          }
        });
        return new StreamingTextResponse(s);
      }
    } else {
      const botPrompt =
        `ONLY generate plain sentences without prefix of who is speaking. 
        DO NOT use "${mind.name}:" prefix. 
        ${mind.instructions}
        If you could, use emojis like *smile* to express emotions.
        Below are relevant details about ${mind.name}'s past and the conversation you are in. 
        ${relevantHistory}
        ${recentChatHistory}\n${mind.name}:
        `
      console.log('bot prompt', botPrompt)

      let response = "";
      try {
        // Mancer API
        const data = {
          messages: [
            {
              role: "user",
              content: prompt,
            }
          ],
          "model": "mythomist"
        }

        const headers = {
          'Content-Type': 'application/json',
          'X-API-KEY': `${process.env.MANCER_API_KEY}`
        }

        let raw_response = await axios.post(`https://neuro.mancer.tech/oai/v1/chat/completions`,
          data, { headers: headers }
        )
        console.log(raw_response.data.choices[0])
        response = raw_response.data.choices[0].message.content
      } catch (error) {
        console.log("error while calling mancer api", error)
      }

      await memoryManager.writeToHistory("" + response.trim(), mindKey);
      var Readable = require("stream").Readable;

      let s = new Readable();
      s.push(response);
      s.push(null);
      if (response !== undefined && response.length > 1) {
        memoryManager.writeToHistory("" + response.trim(), mindKey);

        await prismadb.mind.update({
          where: {
            id: params.chatId
          },
          data: {
            messages: {
              create: {
                content: response.trim(),
                role: "system",
                type: "text",
                userId: user.id,
              },
            },
          }
        });
      }

      return new StreamingTextResponse(s);
    }
  } catch (error) {
    console.log(error)
    return new NextResponse("Internal Error", { status: 500 });
  }
};
