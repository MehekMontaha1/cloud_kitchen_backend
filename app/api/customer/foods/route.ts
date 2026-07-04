import { NextRequest, NextResponse } from 'next/server';
import { getAreaFilteredFoods } from '@/app/lib/orders';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');

    const lat = latStr ? parseFloat(latStr) : 23.8103; // Default Dhaka
    const lng = lngStr ? parseFloat(lngStr) : 90.4125;
    const radius = radiusStr ? parseFloat(radiusStr) : 7; // Default 7km (~30 min radius)

    const foods = await getAreaFilteredFoods(lat, lng, radius);

    return NextResponse.json({ success: true, data: foods }, { status: 200 });
  } catch (error: any) {
    console.error('[API Customer Foods GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch area foods' }, { status: 500 });
  }
}
