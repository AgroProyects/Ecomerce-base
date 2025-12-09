import { NextResponse } from 'next/server'
import { getCategories } from '@/actions/categories/queries'

export async function GET() {
  try {
    const categories = await getCategories(true)
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error in /api/categories:', error)
    return NextResponse.json([], { status: 500 })
  }
}
