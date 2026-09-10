import { db, doc, getDoc } from "./firebaseDb";
import { shops } from "../lib/shops";
import { documentDate } from "../lib/format";
import { mapLimit } from "../lib/async";
export async function readSales(dates, signal) {
  const jobs = [...new Set(dates)].flatMap((date) =>
    shops.map((shop) => ({ date, shopName: shop.name })),
  );
  const results = await mapLimit(
    jobs,
    async ({ date, shopName }) => {
      const snapshot = await getDoc(
        doc(db, "shops", shopName, documentDate(date), "data"),
      );
      return snapshot.exists()
        ? {
            ...snapshot.data(),
            date: documentDate(date),
            isoDate: date,
            shopName,
          }
        : null;
    },
    8,
    signal,
  );
  return results.filter(Boolean);
}
