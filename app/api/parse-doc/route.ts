import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ParseResult = {
  ok: boolean;
  name?: string;
  type?: string;
  size?: number;
  text?: string;
  warning?: string;
  error?: string;
};

function limitText(text: string) {
  const max = Number(process.env.MAX_UPLOAD_CHARS || 120000);
  const clean = text.replace(/\u0000/g, "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{4,}/g, "\n\n\n").trim();
  return clean.length > max ? clean.slice(0, max) + "\n\n[Texte tronqué par NimbrayAI : fichier trop long.]" : clean;
}

function extension(name: string) {
  return name.toLowerCase().split(".").pop() || "";
}

async function parsePlain(buffer: Buffer) {
  return buffer.toString("utf8");
}

async function parsePdf(buffer: Buffer) {
  if (process.env.ENABLE_PDF_PARSE === "false") {
    throw new Error("Lecture PDF désactivée dans .env.local.");
  }
  try {
    const req = eval("require") as NodeRequire;
    const pdf = req("pdf-parse");
    const data = await pdf(buffer);
    return data?.text || "";
  } catch (error: any) {
    throw new Error(`Impossible de lire ce PDF. Vérifie que pdf-parse est installé. Détail : ${error?.message || error}`);
  }
}

async function parseDocx(buffer: Buffer) {
  if (process.env.ENABLE_DOCX_PARSE === "false") {
    throw new Error("Lecture DOCX désactivée dans .env.local.");
  }
  try {
    const req = eval("require") as NodeRequire;
    const mammoth = req("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result?.value || "";
  } catch (error: any) {
    throw new Error(`Impossible de lire ce DOCX. Vérifie que mammoth est installé. Détail : ${error?.message || error}`);
  }
}

export async function POST(req: Request) {
  try {
    if (process.env.ENABLE_DOCUMENT_PARSING === "false") {
      return NextResponse.json({ ok: false, error: "Parsing de documents désactivé." }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Aucun fichier fourni." }, { status: 400 });
    }

    const maxMb = Number(process.env.MAX_UPLOAD_FILE_MB || 12);
    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: `Fichier trop lourd. Limite actuelle : ${maxMb} Mo.` }, { status: 413 });
    }

    const name = file.name || "document";
    const ext = extension(name);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";
    let warning = "";

    if (["txt", "md", "csv", "json", "js", "ts", "tsx", "jsx", "css", "html", "py", "sql", "xml", "yaml", "yml", "log"].includes(ext)) {
      text = await parsePlain(buffer);
    } else if (ext === "pdf") {
      text = await parsePdf(buffer);
      if (!text.trim()) warning = "Le PDF semble vide ou scanné. Les PDF scannés nécessitent un OCR, non inclus dans cette V12.";
    } else if (ext === "docx") {
      text = await parseDocx(buffer);
    } else {
      return NextResponse.json({ ok: false, error: `Format non supporté pour l’instant : .${ext}` }, { status: 400 });
    }

    text = limitText(text);
    return NextResponse.json({ ok: true, name, type: ext, size: file.size, text, warning } satisfies ParseResult);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Erreur de lecture du fichier." }, { status: 500 });
  }
}
