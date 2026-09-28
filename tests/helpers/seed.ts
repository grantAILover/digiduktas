// Testiniai duomenys netikrai DB.
export const IDS = {
  seller: "11111111-1111-4111-8111-111111111111",
  buyer: "22222222-2222-4222-8222-222222222222",
  stranger: "33333333-3333-4333-8333-333333333333", // nieko nepirko
  refunded: "44444444-4444-4444-8444-444444444444", // pinigai grąžinti
  admin: "55555555-5555-4555-8555-555555555555",
  productOpen: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", // allow_download = true
  productLocked: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", // allow_download = false
  fileOpen: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", // PDF produkte „open"
  fileLocked: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", // MP3 produkte „locked"
  missing: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
} as const;

function file(id: string, productId: string, name: string, kind: string) {
  return {
    id,
    product_id: productId,
    storage_path: `${IDS.seller}/${id}-${name}`,
    file_name: name,
    mime_type: null,
    size_bytes: 1000,
    kind,
    position: 0,
    duration_seconds: null,
    stream_provider: null,
    stream_ref: null,
  };
}

export function seed() {
  return {
    profiles: [
      { id: IDS.seller, is_admin: false },
      { id: IDS.buyer, is_admin: false },
      { id: IDS.stranger, is_admin: false },
      { id: IDS.refunded, is_admin: false },
      { id: IDS.admin, is_admin: true },
    ],
    products: [
      { id: IDS.productOpen, title: "E-knyga", seller_id: IDS.seller, allow_download: true },
      { id: IDS.productLocked, title: "Audio knyga", seller_id: IDS.seller, allow_download: false },
    ],
    product_files: [
      file(IDS.fileOpen, IDS.productOpen, "knyga.pdf", "pdf"),
      file(IDS.fileLocked, IDS.productLocked, "skyrius-1.mp3", "audio"),
    ],
    orders: [
      { id: "o1", buyer_id: IDS.buyer, product_id: IDS.productOpen, status: "paid" },
      { id: "o2", buyer_id: IDS.buyer, product_id: IDS.productLocked, status: "paid" },
      { id: "o3", buyer_id: IDS.refunded, product_id: IDS.productOpen, status: "refunded" },
    ],
    playback_progress: [],
  };
}
