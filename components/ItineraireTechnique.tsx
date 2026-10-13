import {
  itineraireTechnique,
  protectionPhytosanitaire,
  ITINERAIRE_SOURCE,
} from "@/lib/itinerary";

export function ItineraireTechnique() {
  return (
    <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="font-bold text-mil-900 text-lg">Itinéraire technique</h2>

      <div className="mt-5 columns-1 gap-8 md:columns-2">
        {itineraireTechnique.map((section) => (
          <div key={section.titre} className="mb-4 break-inside-avoid">
            <h3 className="font-semibold text-stone-800">{section.titre}</h3>
            <ul className="mt-1.5 space-y-1">
              {section.points.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-stone-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mil-400" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="font-semibold text-stone-800">Protection phytosanitaire</h3>
        <div className="mt-3 overflow-x-auto rounded-lg border border-stone-200">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs text-stone-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Ennemi</th>
                <th className="px-3 py-2 font-semibold">Période d'attaque</th>
                <th className="px-3 py-2 font-semibold">Lutte culturale</th>
                <th className="px-3 py-2 font-semibold">Lutte chimique</th>
                <th className="px-3 py-2 font-semibold">Lutte génétique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {protectionPhytosanitaire.map((row) => (
                <tr key={row.ennemi} className="align-top">
                  <td className="px-3 py-2 font-medium text-stone-800">{row.ennemi}</td>
                  <td className="px-3 py-2 text-stone-600 whitespace-nowrap">{row.periode}</td>
                  <td className="px-3 py-2 text-stone-600">{row.culturales}</td>
                  <td className="px-3 py-2 text-stone-600">{row.chimiques}</td>
                  <td className="px-3 py-2 text-stone-600">{row.genetiques}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-5 text-xs text-stone-400">
        <strong className="text-stone-500">Source :</strong> {ITINERAIRE_SOURCE}
      </p>
    </div>
  );
}
