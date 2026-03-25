import { faker } from '@faker-js/faker'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const seededFaker = faker
seededFaker.seed(42)

const recentSalesData = Array.from({ length: 5 }, () => {
  const firstName = seededFaker.person.firstName()
  const lastName = seededFaker.person.lastName()
  const email = seededFaker.internet
    .email({ firstName, lastName })
    .toLowerCase()
  const amount = seededFaker.finance.amount({ min: 10, max: 2000, dec: 2 })
  const initials = `${firstName[0]}${lastName[0]}`
  return { firstName, lastName, email, amount, initials }
})

export function RecentSales() {
  return (
    <div className='space-y-8'>
      {recentSalesData.map((sale) => (
        <div key={sale.email} className='flex items-center gap-4'>
          <Avatar className='h-9 w-9'>
            <AvatarFallback>{sale.initials}</AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-wrap items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-sm leading-none font-medium'>
                {sale.firstName} {sale.lastName}
              </p>
              <p className='text-sm text-muted-foreground'>{sale.email}</p>
            </div>
            <div className='font-medium'>+${sale.amount}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
