import { NextRequest, NextResponse } from "next/server";
import { getVariety } from "@/lib/queries";
import { buildComparisonTable } from "@/lib/comparison";
import { buildXlsx } from "@/lib/xlsx";

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

  const workbook = buildXlsx("Comparaison", buildComparisonTable(varieties));
  const filename = `milchoix-comparaison-${varieties.length}-varietes.xlsx`;

  return new NextResponse(new Uint8Array(workbook), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(workbook.length),
    },
  });
}
