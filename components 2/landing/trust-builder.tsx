import {
  FlaskConical,
  UserCheck,
  Repeat,
  Video,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

const PILLARS = [
  {
    icon: FlaskConical,
    title: "Bilim Temelli Yaklaşım",
    description:
      "Akademik beslenme bilimi ve güncel klinik araştırmalara dayanan, kanıta dayalı diyet protokolleri uygulanır.",
  },
  {
    icon: UserCheck,
    title: "Kişiye Özel Plan",
    description:
      "Yaşam tarzınız, alışkanlıklarınız, alerjileriniz ve laboratuvar değerlerinize göre özelleştirilmiş program.",
  },
  {
    icon: Repeat,
    title: "Sürdürülebilir Sonuç",
    description:
      "Geçici diyetler değil — kalıcı yaşam değişimi. Yo-yo etkisi olmadan, beslenme alışkanlığı kazandırır.",
  },
  {
    icon: Video,
    title: "Online & Yüz Yüze",
    description:
      "Türkiye ve dünyanın her yerinden video görüşme, ya da Kadıköy'deki kliniğimde yüz yüze danışmanlık.",
  },
  {
    icon: MessageCircle,
    title: "Sürekli Takip & Destek",
    description:
      "WhatsApp destek hattı, haftalık check-in ve dijital plan ile süreç boyunca yanınızdayım.",
  },
  {
    icon: ShieldCheck,
    title: "KVKK Uyumlu",
    description:
      "Sağlık verileriniz 6698 sayılı KVKK çerçevesinde şifrelenerek saklanır, üçüncü tarafla paylaşılmaz.",
  },
];

export function TrustBuilder() {
  return (
    <section
      id="neden-biz"
      className="border-y border-slate-100 bg-white py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
            Neden Beni Seçmelisiniz?
          </span>
          <h2 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Sürdürülebilir sonuç,
            <br />
            şeffaf süreç.
          </h2>
          <p className="mt-5 text-balance text-lg leading-relaxed text-slate-600">
            Yo-yo diyetler ve genel-geçer öneriler size zaman kaybettiriyor.
            Bilime dayalı, kişiye özel bir plan ile gerçek sağlık dönüşümü
            mümkün.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="group relative rounded-2xl border border-slate-200 bg-white p-7 transition-all hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-100/40"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                <p.icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">
                {p.description}
              </p>
            </div>
          ))}
        </div>

        {/* İstatistik şeridi */}
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-100 lg:grid-cols-4">
          {[
            ["1.500+", "Memnun danışan"],
            ["9 yıl", "Klinik deneyim"],
            ["%92", "Hedef başarısı"],
            ["7/24", "Randevu talebi"],
          ].map(([n, l]) => (
            <div key={l} className="bg-white px-6 py-8 text-center">
              <div className="text-4xl font-semibold tracking-tight text-emerald-800">
                {n}
              </div>
              <div className="mt-1.5 text-sm text-slate-600">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
