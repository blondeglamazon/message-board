import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')

  console.log(profiles)

  return <div>test</div>
}
