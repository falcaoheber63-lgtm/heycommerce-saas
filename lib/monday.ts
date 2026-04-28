/** Monday.com GraphQL API client */

const ENDPOINT = 'https://api.monday.com/v2'
const TOKEN = () => process.env.MONDAY_API_TOKEN!

export interface MondayItem {
  id: string
  name: string
  created_at: string
  updated_at: string
  column_values: { id: string; text: string }[]
}

export interface MondayBoard {
  id: string
  name: string
}

export async function listBoards(): Promise<MondayBoard[]> {
  const data = await gql('{ boards(limit: 50) { id name } }')
  return data.boards ?? []
}

export async function getBoardItems(
  boardId: string,
  columnIds: string[]
): Promise<MondayItem[]> {
  const cols = columnIds.map(c => `"${c}"`).join(',')
  const items: MondayItem[] = []
  let cursor: string | null = null

  do {
    let query: string
    if (!cursor) {
      query = `{
        boards(ids: [${boardId}]) {
          items_page(limit: 100) {
            cursor
            items {
              id name created_at updated_at
              column_values(ids: [${cols}]) { id text }
            }
          }
        }
      }`
    } else {
      query = `{
        next_items_page(limit: 100, cursor: "${cursor}") {
          cursor
          items {
            id name created_at updated_at
            column_values(ids: [${cols}]) { id text }
          }
        }
      }`
    }

    const data = await gql(query)
    const page = cursor
      ? data.next_items_page
      : data.boards?.[0]?.items_page

    items.push(...(page?.items ?? []))
    cursor = page?.cursor ?? null
  } while (cursor)

  return items
}

export async function searchItemsByPhone(
  boardId: string,
  phone: string,
  columnId: string
): Promise<MondayItem[]> {
  const query = `{
    items_page_by_column_values(
      limit: 5,
      board_id: ${boardId},
      columns: [{ column_id: "${columnId}", column_values: ["${phone}"] }]
    ) {
      items {
        id name created_at
        column_values(ids: ["text_mm1sq9vz", "dropdown_mm1qw30f"]) { id text }
      }
    }
  }`
  const data = await gql(query)
  return data.items_page_by_column_values?.items ?? []
}

export async function updateItemStatus(
  itemId: string,
  boardId: string,
  columnId: string,
  value: string
): Promise<boolean> {
  const mutation = `mutation {
    change_column_value(
      board_id: ${boardId},
      item_id: ${itemId},
      column_id: "${columnId}",
      value: "${value}"
    ) { id }
  }`
  await gql(mutation)
  return true
}

async function gql(query: string): Promise<Record<string, unknown>> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: TOKEN(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`Monday API ${res.status}: ${await res.text()}`)
  const json = await res.json() as { data?: Record<string, unknown>; errors?: unknown[] }
  if (json.errors?.length) throw new Error(`Monday GraphQL error: ${JSON.stringify(json.errors)}`)
  return json.data ?? {}
}
