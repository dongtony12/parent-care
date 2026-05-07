import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type MealType = 'lunch' | 'dinner'

export async function uploadMealPhoto(
  supabase: SupabaseClient<Database>,
  args: { userId: string; entryId: string; mealType: MealType; blob: Blob },
): Promise<string> {
  const ts = Date.now()
  const path = `${args.userId}/${args.entryId}/${args.mealType}-${ts}.jpg`

  const { error } = await supabase.storage
    .from('meal-photos')
    .upload(path, args.blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (error) throw error
  return path
}
