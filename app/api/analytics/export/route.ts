import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsForExport, type DateRangeType } from '@/actions/analytics'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const range = (searchParams.get('range') as DateRangeType) || '30days'

    // Validar el rango
    const validRanges: DateRangeType[] = ['7days', '30days', '90days', 'year', 'all']
    if (!validRanges.includes(range)) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      )
    }

    const data = await getAnalyticsForExport(range)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching analytics export data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
