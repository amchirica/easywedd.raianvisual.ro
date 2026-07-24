"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sectionDefaults } from "@/lib/invitations/sections/defaults";
import { newId, type CanonicalSectionKey, type SectionContentMap } from "@/lib/invitations/sections/types";

type EditorProps<K extends CanonicalSectionKey> = {
  data: SectionContentMap[K];
  onChange: (next: SectionContentMap[K]) => void;
  onReset: () => void;
};

function Field({
  label,
  value,
  onChange,
  multiline,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {multiline ? (
        <textarea
          className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function Panel({
  title,
  onReset,
  children,
}: {
  title: string;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-2xl">{title}</h2>
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          Resetează
        </Button>
      </div>
      {children}
    </div>
  );
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function UrlField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const ok = isValidUrl(value);
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!ok}
      />
      {!ok ? (
        <p className="text-xs text-destructive">URL invalid (http/https)</p>
      ) : null}
    </div>
  );
}

function HeroEditor({ data, onChange, onReset }: EditorProps<"hero">) {
  return (
    <Panel title="Copertă" onReset={onReset}>
      <Field label="Eyebrow" value={data.eyebrow} onChange={(eyebrow) => onChange({ ...data, eyebrow })} />
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field label="Subtitlu" value={data.subtitle} onChange={(subtitle) => onChange({ ...data, subtitle })} />
      <UrlField label="URL imagine" value={data.imageUrl} onChange={(imageUrl) => onChange({ ...data, imageUrl })} />
    </Panel>
  );
}

function AnnouncementEditor({ data, onChange, onReset }: EditorProps<"announcement">) {
  return (
    <Panel title="Anunț" onReset={onReset}>
      <Field label="Eyebrow" value={data.eyebrow} onChange={(eyebrow) => onChange({ ...data, eyebrow })} />
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label="Descriere"
        value={data.description}
        multiline
        onChange={(description) => onChange({ ...data, description })}
      />
    </Panel>
  );
}

function CoupleEditor({ data, onChange, onReset }: EditorProps<"couple">) {
  return (
    <Panel title="Cuplu & introducere" onReset={onReset}>
      <Field label="Nume 1" value={data.name1} onChange={(name1) => onChange({ ...data, name1 })} />
      <Field label="Nume 2" value={data.name2} onChange={(name2) => onChange({ ...data, name2 })} />
      <Field
        label="Introducere"
        value={data.introText}
        multiline
        onChange={(introText) => onChange({ ...data, introText })}
      />
      <Field
        label="Părinți"
        value={data.parentsText}
        multiline
        onChange={(parentsText) => onChange({ ...data, parentsText })}
      />
      <Field
        label="Nași"
        value={data.godparentsText}
        multiline
        onChange={(godparentsText) => onChange({ ...data, godparentsText })}
      />
    </Panel>
  );
}

function StoryEditor({ data, onChange, onReset }: EditorProps<"story">) {
  return (
    <Panel title="Povestea noastră" onReset={onReset}>
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label="Introducere"
        value={data.introduction}
        multiline
        onChange={(introduction) => onChange({ ...data, introduction })}
      />
      {data.items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Moment {index + 1}</p>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({ ...data, items: moveItem(data.items, index, index - 1) })
                }
              >
                ↑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({ ...data, items: moveItem(data.items, index, index + 1) })
                }
              >
                ↓
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({
                    ...data,
                    items: data.items.filter((i) => i.id !== item.id),
                  })
                }
              >
                Șterge
              </Button>
            </div>
          </div>
          <Field
            label="Dată"
            value={item.date}
            onChange={(date) =>
              onChange({
                ...data,
                items: data.items.map((i) => (i.id === item.id ? { ...i, date } : i)),
              })
            }
          />
          <Field
            label="Titlu"
            value={item.title}
            onChange={(title) =>
              onChange({
                ...data,
                items: data.items.map((i) => (i.id === item.id ? { ...i, title } : i)),
              })
            }
          />
          <Field
            label="Descriere"
            value={item.description}
            multiline
            onChange={(description) =>
              onChange({
                ...data,
                items: data.items.map((i) =>
                  i.id === item.id ? { ...i, description } : i,
                ),
              })
            }
          />
          <UrlField
            label="URL imagine"
            value={item.imageUrl}
            onChange={(imageUrl) =>
              onChange({
                ...data,
                items: data.items.map((i) =>
                  i.id === item.id ? { ...i, imageUrl } : i,
                ),
              })
            }
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange({
            ...data,
            items: [
              ...data.items,
              {
                id: newId("story"),
                date: "",
                title: "Moment nou",
                description: "",
                imageUrl: "",
              },
            ],
          })
        }
      >
        Adaugă moment
      </Button>
    </Panel>
  );
}

function CountdownEditor({ data, onChange, onReset }: EditorProps<"countdown">) {
  return (
    <Panel title="Numărătoare inversă" onReset={onReset}>
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label="Data nunții"
        type="date"
        value={data.targetDate}
        onChange={(targetDate) => onChange({ ...data, targetDate })}
      />
    </Panel>
  );
}

function WhenWhereEditor({ data, onChange, onReset }: EditorProps<"when_where">) {
  return (
    <Panel title="Când și unde" onReset={onReset}>
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label="Data"
        type="date"
        value={data.weddingDate}
        onChange={(weddingDate) => onChange({ ...data, weddingDate })}
      />
      <Field
        label="Ora"
        type="time"
        value={data.weddingTime}
        onChange={(weddingTime) => onChange({ ...data, weddingTime })}
      />
      <Field
        label="Locație ceremonie"
        value={data.ceremonyLocation}
        onChange={(ceremonyLocation) => onChange({ ...data, ceremonyLocation })}
      />
      <Field
        label="Locație petrecere"
        value={data.receptionLocation}
        onChange={(receptionLocation) => onChange({ ...data, receptionLocation })}
      />
      <UrlField
        label="URL hartă"
        value={data.mapUrl}
        onChange={(mapUrl) => onChange({ ...data, mapUrl })}
      />
    </Panel>
  );
}

function TimelineEditor({ data, onChange, onReset }: EditorProps<"timeline">) {
  return (
    <Panel title="Programul evenimentului" onReset={onReset}>
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      {data.items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Eveniment {index + 1}</p>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({ ...data, items: moveItem(data.items, index, index - 1) })
                }
              >
                ↑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({ ...data, items: moveItem(data.items, index, index + 1) })
                }
              >
                ↓
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({
                    ...data,
                    items: data.items.filter((i) => i.id !== item.id),
                  })
                }
              >
                Șterge
              </Button>
            </div>
          </div>
          {(
            [
              ["time", "Ora", "time"],
              ["title", "Titlu", "text"],
              ["description", "Descriere", "text"],
              ["location", "Locație", "text"],
              ["icon", "Iconiță", "text"],
            ] as const
          ).map(([key, label, type]) => (
            <Field
              key={key}
              label={label}
              type={type}
              value={item[key]}
              multiline={key === "description"}
              onChange={(v) =>
                onChange({
                  ...data,
                  items: data.items.map((i) =>
                    i.id === item.id ? { ...i, [key]: v } : i,
                  ),
                })
              }
            />
          ))}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange({
            ...data,
            items: [
              ...data.items,
              {
                id: newId("tl"),
                time: "",
                title: "Eveniment nou",
                description: "",
                location: "",
                icon: "dot",
              },
            ],
          })
        }
      >
        Adaugă eveniment
      </Button>
    </Panel>
  );
}

function GalleryEditor({ data, onChange, onReset }: EditorProps<"gallery">) {
  return (
    <Panel title="Galerie" onReset={onReset}>
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      {data.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nicio imagine încă. Adaugă URL-uri pentru fotografii.
        </p>
      ) : null}
      {data.items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex justify-between gap-1">
            <p className="text-xs text-muted-foreground">Imagine {index + 1}</p>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({ ...data, items: moveItem(data.items, index, index - 1) })
                }
              >
                ↑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({ ...data, items: moveItem(data.items, index, index + 1) })
                }
              >
                ↓
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({
                    ...data,
                    items: data.items.filter((i) => i.id !== item.id),
                  })
                }
              >
                Șterge
              </Button>
            </div>
          </div>
          <UrlField
            label="URL imagine"
            value={item.url}
            onChange={(url) =>
              onChange({
                ...data,
                items: data.items.map((i) => (i.id === item.id ? { ...i, url } : i)),
              })
            }
          />
          <Field
            label="Legendă"
            value={item.caption}
            onChange={(caption) =>
              onChange({
                ...data,
                items: data.items.map((i) =>
                  i.id === item.id ? { ...i, caption } : i,
                ),
              })
            }
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange({
            ...data,
            items: [...data.items, { id: newId("gal"), url: "", caption: "" }],
          })
        }
      >
        Adaugă imagine
      </Button>
    </Panel>
  );
}

function DressCodeEditor({ data, onChange, onReset }: EditorProps<"dress_code">) {
  return (
    <Panel title="Dress code" onReset={onReset}>
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label="Descriere"
        value={data.description}
        multiline
        onChange={(description) => onChange({ ...data, description })}
      />
      <div className="space-y-2">
        <Label>Paletă culori</Label>
        {data.colors.map((color, index) => (
          <div key={`${color}-${index}`} className="flex gap-2">
            <Input
              type="color"
              value={color.startsWith("#") ? color : "#888888"}
              onChange={(e) => {
                const colors = [...data.colors];
                colors[index] = e.target.value;
                onChange({ ...data, colors });
              }}
              className="w-14"
            />
            <Input
              value={color}
              onChange={(e) => {
                const colors = [...data.colors];
                colors[index] = e.target.value;
                onChange({ ...data, colors });
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  ...data,
                  colors: data.colors.filter((_, i) => i !== index),
                })
              }
            >
              Șterge
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...data, colors: [...data.colors, "#C4A574"] })}
        >
          Adaugă culoare
        </Button>
      </div>
      <UrlField
        label="Imagine inspirație"
        value={data.inspirationImageUrl}
        onChange={(inspirationImageUrl) => onChange({ ...data, inspirationImageUrl })}
      />
    </Panel>
  );
}

function AccommodationEditor({ data, onChange, onReset }: EditorProps<"accommodation">) {
  return (
    <Panel title="Cazare" onReset={onReset}>
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label="Descriere"
        value={data.description}
        multiline
        onChange={(description) => onChange({ ...data, description })}
      />
      {data.items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">Cazare {index + 1}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  ...data,
                  items: data.items.filter((i) => i.id !== item.id),
                })
              }
            >
              Șterge
            </Button>
          </div>
          {(
            [
              ["name", "Nume"],
              ["address", "Adresă"],
              ["phone", "Telefon"],
              ["bookingInfo", "Info rezervare"],
            ] as const
          ).map(([key, label]) => (
            <Field
              key={key}
              label={label}
              value={item[key]}
              onChange={(v) =>
                onChange({
                  ...data,
                  items: data.items.map((i) =>
                    i.id === item.id ? { ...i, [key]: v } : i,
                  ),
                })
              }
            />
          ))}
          <UrlField
            label="Website"
            value={item.website}
            onChange={(website) =>
              onChange({
                ...data,
                items: data.items.map((i) =>
                  i.id === item.id ? { ...i, website } : i,
                ),
              })
            }
          />
          <UrlField
            label="URL hartă"
            value={item.mapUrl}
            onChange={(mapUrl) =>
              onChange({
                ...data,
                items: data.items.map((i) =>
                  i.id === item.id ? { ...i, mapUrl } : i,
                ),
              })
            }
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange({
            ...data,
            items: [
              ...data.items,
              {
                id: newId("acc"),
                name: "",
                address: "",
                phone: "",
                website: "",
                bookingInfo: "",
                mapUrl: "",
              },
            ],
          })
        }
      >
        Adaugă cazare
      </Button>
    </Panel>
  );
}

function TransportEditor({ data, onChange, onReset }: EditorProps<"transport">) {
  return (
    <Panel title="Transport" onReset={onReset}>
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label="Descriere"
        value={data.description}
        multiline
        onChange={(description) => onChange({ ...data, description })}
      />
      <Field
        label="Puncte de preluare"
        value={data.pickupPoints}
        multiline
        onChange={(pickupPoints) => onChange({ ...data, pickupPoints })}
      />
      <Field
        label="Ore plecare"
        value={data.departureTimes}
        onChange={(departureTimes) => onChange({ ...data, departureTimes })}
      />
      <Field
        label="Ore întoarcere"
        value={data.returnTimes}
        onChange={(returnTimes) => onChange({ ...data, returnTimes })}
      />
      <Field
        label="Contact"
        value={data.contact}
        onChange={(contact) => onChange({ ...data, contact })}
      />
    </Panel>
  );
}

function GiftsEditor({ data, onChange, onReset }: EditorProps<"gifts">) {
  return (
    <Panel title="Daruri" onReset={onReset}>
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label="Descriere"
        value={data.description}
        multiline
        onChange={(description) => onChange({ ...data, description })}
      />
      <Field
        label="Detalii bancare"
        value={data.bankDetails}
        multiline
        onChange={(bankDetails) => onChange({ ...data, bankDetails })}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={data.hideBankDetails}
          onChange={(e) => onChange({ ...data, hideBankDetails: e.target.checked })}
        />
        Ascunde detaliile financiare pe site-ul public
      </label>
      <UrlField
        label="URL listă cadouri"
        value={data.registryUrl}
        onChange={(registryUrl) => onChange({ ...data, registryUrl })}
      />
    </Panel>
  );
}

function FaqEditor({ data, onChange, onReset }: EditorProps<"faq">) {
  return (
    <Panel title="Întrebări frecvente" onReset={onReset}>
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      {data.items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">Întrebare {index + 1}</p>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({ ...data, items: moveItem(data.items, index, index - 1) })
                }
              >
                ↑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({ ...data, items: moveItem(data.items, index, index + 1) })
                }
              >
                ↓
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({
                    ...data,
                    items: data.items.filter((i) => i.id !== item.id),
                  })
                }
              >
                Șterge
              </Button>
            </div>
          </div>
          <Field
            label="Întrebare"
            value={item.question}
            onChange={(question) =>
              onChange({
                ...data,
                items: data.items.map((i) =>
                  i.id === item.id ? { ...i, question } : i,
                ),
              })
            }
          />
          <Field
            label="Răspuns"
            value={item.answer}
            multiline
            onChange={(answer) =>
              onChange({
                ...data,
                items: data.items.map((i) =>
                  i.id === item.id ? { ...i, answer } : i,
                ),
              })
            }
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange({
            ...data,
            items: [
              ...data.items,
              { id: newId("faq"), question: "", answer: "" },
            ],
          })
        }
      >
        Adaugă întrebare
      </Button>
    </Panel>
  );
}

function RsvpEditor({ data, onChange, onReset }: EditorProps<"rsvp">) {
  return (
    <Panel title="Confirmare participare" onReset={onReset}>
      <Field label="Titlu" value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label="Mesaj"
        value={data.message}
        multiline
        onChange={(message) => onChange({ ...data, message })}
      />
    </Panel>
  );
}

function FooterEditor({ data, onChange, onReset }: EditorProps<"footer">) {
  return (
    <Panel title="Încheiere" onReset={onReset}>
      <Field label="Text" value={data.text} onChange={(text) => onChange({ ...data, text })} />
      <Field
        label="Semnătură"
        value={data.signature}
        onChange={(signature) => onChange({ ...data, signature })}
      />
    </Panel>
  );
}

export const sectionEditors: {
  [K in CanonicalSectionKey]: (props: EditorProps<K>) => React.ReactNode;
} = {
  hero: HeroEditor,
  announcement: AnnouncementEditor,
  couple: CoupleEditor,
  story: StoryEditor,
  countdown: CountdownEditor,
  when_where: WhenWhereEditor,
  timeline: TimelineEditor,
  gallery: GalleryEditor,
  dress_code: DressCodeEditor,
  accommodation: AccommodationEditor,
  transport: TransportEditor,
  gifts: GiftsEditor,
  faq: FaqEditor,
  rsvp: RsvpEditor,
  footer: FooterEditor,
};

export function SectionEditorPanel({
  sectionKey,
  data,
  onChange,
  wedding,
}: {
  sectionKey: CanonicalSectionKey;
  data: SectionContentMap[CanonicalSectionKey];
  onChange: (next: SectionContentMap[CanonicalSectionKey]) => void;
  wedding?: Parameters<typeof sectionDefaults>[1];
}) {
  const Editor = sectionEditors[sectionKey] as (props: {
    data: SectionContentMap[CanonicalSectionKey];
    onChange: (next: SectionContentMap[CanonicalSectionKey]) => void;
    onReset: () => void;
  }) => React.ReactNode;

  return (
    <Editor
      data={data}
      onChange={onChange}
      onReset={() => onChange(sectionDefaults(sectionKey, wedding))}
    />
  );
}
