import { NextRequest, NextResponse } from "next/server";
import { getVariety } from "@/lib/queries";
import { buildComparisonPdf } from "@/lib/pdf";

export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value) && value > 0);

  const varieties = ids
    .map((id) => getVariety(id))
    .filter((variety): variety is NonNullable<typeof variety> => variety != null);

  if (varieties.length < 2) {
    return NextResponse.json(
      { error: "Sélectionnez au moins deux variétés pour l'export." },
      { status: 400 }
    );
  }

  const pdf = buildComparisonPdf(varieties);
  const filename = `milchoix-comparaison-${varieties.length}-varietes.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.length),
    },
  });
}
