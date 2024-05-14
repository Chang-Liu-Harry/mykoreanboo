import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Webhook Error: ${error.message}`);
      return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    } else {
      console.error("Unknown webhook error", error);
      return new NextResponse("Webhook Error", { status: 400 });
    }
  }

  console.log(`Received event: ${event.type}`);
  console.log(`Event data: ${JSON.stringify(event.data)}`);

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      if (!session?.metadata?.userId) {
        console.error("User id is required");
        return new NextResponse("User id is required", { status: 400 });
      }

      console.log(`Creating subscription for user: ${session.metadata.userId}`);

      await prismadb.userSubscription.create({
        data: {
          userId: session.metadata.userId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      });

      console.log(`Subscription created for user: ${session.metadata.userId}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error creating subscription: ${error.message}`);
        return new NextResponse(`Error creating subscription: ${error.message}`, { status: 500 });
      } else {
        console.error("Unknown error creating subscription", error);
        return new NextResponse("Error creating subscription", { status: 500 });
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await prismadb.userSubscription.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      });

      console.log(`Subscription updated for user with subscription id: ${subscription.id}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error updating subscription: ${error.message}`);
        return new NextResponse(`Error updating subscription: ${error.message}`, { status: 500 });
      } else {
        console.error("Unknown error updating subscription", error);
        return new NextResponse("Error updating subscription", { status: 500 });
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
