import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  const API_KEY = process.env.GOOGLE_API_KEY;

  if (!API_KEY) {
    return NextResponse.json(
      { error: "Missing Google API Key" },
      { status: 500 }
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&type=point_of_interest&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    const results =
      data.results?.slice(0, 5).map((place) => place.name) || [];

    return NextResponse.json({ places: results });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}