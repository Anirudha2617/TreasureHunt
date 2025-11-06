import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { CalendarIcon } from "lucide-react"

interface MysteryCardProps {
  logo?: string
  title: string
  startsAt: string
  endsAt: string
}

export default function MysteryCard({ logo, title, startsAt, endsAt }: MysteryCardProps) {
  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md hover:shadow-lg transition-all">
      <CardHeader className="flex items-center gap-3">
        {logo && (
          <img
            src={logo}
            alt={`${title} logo`}
            className="w-12 h-12 rounded-full object-cover border"
          />
        )}
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>

      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground gap-2">
          <CalendarIcon className="w-4 h-4" />
          <span>{new Date(startsAt).toLocaleDateString()}</span>
          <span>→</span>
          <span>{new Date(endsAt).toLocaleDateString()}</span>
        </div>
      </CardContent>

      <CardFooter>
        <button className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          View Details
        </button>
      </CardFooter>
    </Card>
  )
}
