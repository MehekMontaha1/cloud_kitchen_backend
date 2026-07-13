import { NextRequest, NextResponse } from 'next/server';
import { getAreaFilteredFoods } from '@/app/lib/orders';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');

    if (!latStr || !lngStr) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Valid lat and lng are required' }, { status: 400 });
    }

    const radius = radiusStr ? parseFloat(radiusStr) : 7; // Default 7km (~30 min radius)

    const foods = await getAreaFilteredFoods(lat, lng, radius);

    return NextResponse.json({ success: true, data: foods }, { status: 200 });
  } catch (error: any) {
    console.error('[API Customer Foods GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch area foods' }, { status: 500 });
  }
}
