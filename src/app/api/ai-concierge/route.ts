import { NextRequest, NextResponse } from "next/server";
import { getHotels } from "@/services/hotel.service";

// ── Concierge AI Engine ───────────────────────────────────────────────────────
// Uses Gemini 1.5 Flash if GEMINI_API_KEY is set, otherwise falls back to a
// sophisticated rule-based NLP parser that works perfectly for demos.

interface ConciergeParams {
  category?: string;
  experienceType?: string;
  minStars?: number;
  maxPrice?: number;
  country?: string;
  query?: string;
  reasoning: string;
  mood: string;
  highlights: string[];
}

// ── Rule-based NLP fallback (works without any API key) ──────────────────────
function parseQueryLocally(input: string): ConciergeParams {
  const text = input.toLowerCase();

  // --- Category detection ---
  let category: string | undefined;
  if (/\b(playa|beach|mar|océano|ocean|coastal|costa)\b/.test(text)) category = "BEACH";
  else if (/\b(montaña|mountain|sierra|andes|patagonia|bosque|forest|trekking|hiking|naturaleza|nature)\b/.test(text)) category = "MOUNTAIN";
  else if (/\b(eco|sostenible|sustainable|verde|green|lodge)\b/.test(text)) category = "ECO";
  else if (/\b(lujo|luxury|exclusive|exclusivo|premium|5 estrellas|five star)\b/.test(text)) category = "LUXURY";
  else if (/\b(ciudad|city|urbano|urban|downtown|metro|negocios|business)\b/.test(text)) category = "CITY";
  else if (/\b(boutique|íntimo|intimate|acogedor|cozy|charming)\b/.test(text)) category = "BOUTIQUE";

  // --- Experience type ---
  let experienceType: string | undefined;
  if (/\b(spa|masaje|massage|relajar|relax|bienestar|wellness|termas|hot springs)\b/.test(text)) experienceType = "SPA";
  else if (/\b(gastronomía|gastronomy|cena|dinner|gourmet|restaurante|restaurant|mariscos|seafood|chef)\b/.test(text)) experienceType = "DINING";
  else if (/\b(transfer|aeropuerto|airport|traslado|shuttle|transporte)\b/.test(text)) experienceType = "TRANSPORT";
  else if (/\b(aventura|adventure|tour|experiencia|experience|excursión|excursion|kayak|senderismo)\b/.test(text)) experienceType = "EXPERIENCE";

  // --- Star rating ---
  let minStars: number | undefined;
  if (/\b(5 estrellas|five star|five-star|máximo lujo|ultra luxe)\b/.test(text)) minStars = 5;
  else if (/\b(4 estrellas|four star|cuatro estrellas)\b/.test(text)) minStars = 4;
  else if (/\b(lujo|luxury|lujoso|exclusivo|premium)\b/.test(text)) minStars = 4;

  // --- Country ---
  let country: string | undefined;
  if (/\b(chile|chilena|chileno)\b/.test(text)) country = "Chile";
  else if (/\b(argentina|argentino|buenos aires)\b/.test(text)) country = "Argentina";
  else if (/\b(perú|peru|cusco|lima|machu picchu)\b/.test(text)) country = "Perú";

  // --- Budget ---
  let maxPrice: number | undefined;
  if (/\b(económico|budget|barato|cheap|precio bajo)\b/.test(text)) maxPrice = 150000;
  else if (/\b(moderado|moderate|intermedio|mid-range)\b/.test(text)) maxPrice = 300000;
  // "sin límite", "ilimitado", "lo mejor" → no maxPrice limit

  // --- Detect mood for a richer response ---
  let mood = "escapada especial";
  if (/\b(aniversario|anniversary|boda|wedding|luna de miel|honeymoon|romántico|romantic)\b/.test(text)) mood = "escapada romántica";
  else if (/\b(familia|family|niños|children|kids)\b/.test(text)) mood = "viaje familiar";
  else if (/\b(negocios|business|trabajo|work|conferencia|conference)\b/.test(text)) mood = "viaje de negocios";
  else if (/\b(aventura|adventure|explorar|explore)\b/.test(text)) mood = "aventura y exploración";
  else if (/\b(descanso|rest|relajar|relax|paz|peace|tranquilidad|serenity)\b/.test(text)) mood = "descanso y bienestar";
  else if (/\b(cumpleaños|birthday|celebración|celebration|festejo)\b/.test(text)) mood = "celebración especial";

  // --- Generate reasoning ---
  const parts: string[] = [];
  if (mood !== "escapada especial") parts.push(`Detecto que buscas una ${mood}`);
  if (category) parts.push(`hoteles tipo ${getCategoryLabel(category)}`);
  if (experienceType) parts.push(`con servicio de ${getExperienceLabel(experienceType)}`);
  if (country) parts.push(`en ${country}`);
  if (minStars) parts.push(`con ${minStars}+ estrellas`);
  if (maxPrice) parts.push(`dentro de tu presupuesto`);

  const reasoning = parts.length > 0
    ? `Entendí tu solicitud. ${parts.join(", ")}. Aquí están las mejores opciones para ti:`
    : "Analicé tu solicitud y seleccioné las experiencias más exclusivas que se adaptan a lo que describes:";

  const highlights: string[] = [];
  if (experienceType === "SPA") highlights.push("Spa & Bienestar incluido");
  if (experienceType === "DINING") highlights.push("Alta Gastronomía");
  if (category === "BEACH") highlights.push("Frente al mar");
  if (category === "MOUNTAIN") highlights.push("Entorno natural privilegiado");
  if (minStars === 5) highlights.push("5 Estrellas");
  if (mood.includes("romántica")) highlights.push("Perfecto para parejas");
  if (mood.includes("familiar")) highlights.push("Ideal para familias");

  // Fallback query: use meaningful words from the input
  const searchQuery = extractSearchTerms(input);

  return { category, experienceType, minStars, maxPrice, country, query: searchQuery || undefined, reasoning, mood, highlights };
}

function extractSearchTerms(input: string): string {
  // Remove stop words and keep meaningful terms for the text search
  const stopWords = /\b(quiero|necesito|busco|algo|con|de|la|el|un|una|que|tiene|sea|para|este|esta|es|son|los|las|mi|en|y|o|pero|sin|muy|mas|más)\b/gi;
  const cleaned = input.replace(stopWords, " ").trim().replace(/\s+/g, " ");
  // Keep max 3 significant words
  const words = cleaned.split(" ").filter(w => w.length > 3).slice(0, 3);
  return words.join(" ");
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = { LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco", BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad" };
  return labels[cat] ?? cat;
}
function getExperienceLabel(exp: string): string {
  const labels: Record<string, string> = { SPA: "Spa & Bienestar", DINING: "Gastronomía", TRANSPORT: "Transporte", EXPERIENCE: "Experiencias" };
  return labels[exp] ?? exp;
}

// ── Gemini API call (if key is available) ────────────────────────────────────
async function parseQueryWithGemini(input: string, apiKey: string): Promise<ConciergeParams> {
  const prompt = `Eres el concierge IA de una plataforma de hoteles boutique de lujo en Latinoamérica.
El usuario escribió: "${input}"

Analiza la solicitud y responde ÚNICAMENTE con un JSON válido (sin texto extra, sin markdown) con esta estructura exacta:
{
  "category": "LUXURY" | "BOUTIQUE" | "ECO" | "BEACH" | "MOUNTAIN" | "CITY" | null,
  "experienceType": "SPA" | "DINING" | "TRANSPORT" | "EXPERIENCE" | null,
  "minStars": 3 | 4 | 5 | null,
  "maxPrice": number | null,
  "country": "Chile" | "Argentina" | "Perú" | null,
  "query": "palabras clave de búsqueda" | null,
  "mood": "descripción corta del tipo de viaje detectado",
  "reasoning": "Explicación cálida de 1-2 oraciones de por qué estas opciones son perfectas para el usuario",
  "highlights": ["característica 1", "característica 2", "característica 3"]
}

Reglas:
- maxPrice en pesos chilenos (CLP). Si el usuario dice "sin límite" o "premium", usar null.
- reasoning debe sonar como un concierge de lujo, personalizado y cálido.
- highlights son 2-3 razones clave por las que estas propiedades son perfectas.
- Si no se detecta algún filtro, usar null.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Gemini response");
  return JSON.parse(jsonMatch[0]) as ConciergeParams;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { query, locale = "es" } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json({ error: "Query demasiado corta" }, { status: 400 });
    }

    // 1. Parse intent (Gemini if key available, else local NLP)
    let params: ConciergeParams;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        params = await parseQueryWithGemini(query.trim(), geminiKey);
      } catch {
        params = parseQueryLocally(query.trim());
      }
    } else {
      params = parseQueryLocally(query.trim());
    }

    // 2. Build hotel filters from params
    const filters: Record<string, any> = {};
    if (params.category) filters.category = params.category;
    if (params.experienceType) filters.experienceType = params.experienceType;
    if (params.minStars) filters.minStars = params.minStars;
    if (params.maxPrice) filters.maxPrice = params.maxPrice;
    if (params.country) filters.country = params.country;
    if (params.query) filters.query = params.query;

    // 3. Fetch matching hotels
    const hotels = await getHotels({ ...filters, limit: 9 });

    // 4. If too restrictive and no results, try relaxing filters
    let finalHotels = hotels;
    if (hotels.length === 0 && Object.keys(filters).length > 1) {
      // Try with fewer filters (keep category + experienceType only)
      const relaxed: Record<string, any> = {};
      if (params.category) relaxed.category = params.category;
      if (params.experienceType) relaxed.experienceType = params.experienceType;
      finalHotels = await getHotels({ ...relaxed, limit: 9 });
    }

    return NextResponse.json({
      hotels: finalHotels,
      reasoning: params.reasoning,
      mood: params.mood,
      highlights: params.highlights ?? [],
      detectedFilters: {
        category: params.category ?? null,
        experienceType: params.experienceType ?? null,
        minStars: params.minStars ?? null,
        country: params.country ?? null,
      },
      usingAI: !!geminiKey,
    });
  } catch (err) {
    console.error("[ai-concierge]", err);
    return NextResponse.json({ error: "Error interno del concierge" }, { status: 500 });
  }
}
