"use client"

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarIcon } from "lucide-react"

interface Mystery {
  id: number
  name: string
  starts_at: string
  ends_at: string
  logo?: string
}


export default function MysteryGrid({ mysteries }: { mysteries?: Mystery[] }) {
  // Show skeletons if mysteries not loaded yet
  if (!mysteries || mysteries.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="w-full max-w-sm rounded-2xl shadow-sm">
            <CardHeader className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="w-24 h-4 rounded" />
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="w-24 h-4 rounded" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="w-full h-9 rounded-lg" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  // Render actual mystery cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {mysteries.map((mystery) => (
        <Card
          key={mystery.id}
          className="w-full max-w-sm rounded-2xl shadow-md hover:shadow-lg transition-all"
        >
          <CardHeader className="flex items-center gap-3">
            {mystery.logo ? (
              <img
                src={mystery.logo}
                alt={mystery.name}
                className="w-12 h-12 rounded-full object-cover border"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200" />
            )}
            <h3 className="text-lg font-semibold">{mystery.name}</h3>
          </CardHeader>

          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date(mystery.starts_at).toLocaleDateString()}</span>
              <span>→</span>
              <span>{new Date(mystery.ends_at).toLocaleDateString()}</span>
            </div>
          </CardContent>

          <CardFooter>
            <button className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              View Details
            </button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
