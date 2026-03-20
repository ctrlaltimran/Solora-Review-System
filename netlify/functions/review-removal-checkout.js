const Stripe = require("stripe")

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

exports.handler = async (event) => {


  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  }


  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers
    }
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" })
    }
  }

  try {

    const data = JSON.parse(event.body || "{}")
    const reviewCount = data?.order?.reviewCount || 1

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Review Removal"
            },
            unit_amount: 35000
          },
          quantity: reviewCount
        }
      ],
      success_url: "https://early-delivers-621747.framer.app/confirmation",
      cancel_url: "https://early-delivers-621747.framer.app/remove-negative-reviews"
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        redirectUrl: session.url
      })
    }

  } catch (err) {

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: err.message
      })
    }

  }
}