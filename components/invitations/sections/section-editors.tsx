"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sectionDefaults } from "@/lib/invitations/sections/defaults";
import { newId, type CanonicalSectionKey, type SectionContentMap } from "@/lib/invitations/sections/types";

function useEditorDict() {
  const { dict } = useI18n();
  return dict.invitations.editor;
}

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
  const ed = useEditorDict();
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-2xl">{title}</h2>
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          {ed.reset}
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
  const ed = useEditorDict();
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
        <p className="text-xs text-destructive">{ed.invalidUrl}</p>
      ) : null}
    </div>
  );
}

function HeroEditor({ data, onChange, onReset }: EditorProps<"hero">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.cover} onReset={onReset}>
      <Field label={ed.eyebrow} value={data.eyebrow} onChange={(eyebrow) => onChange({ ...data, eyebrow })} />
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field label={ed.subtitle} value={data.subtitle} onChange={(subtitle) => onChange({ ...data, subtitle })} />
      <UrlField label={ed.imageUrl} value={data.imageUrl} onChange={(imageUrl) => onChange({ ...data, imageUrl })} />
    </Panel>
  );
}

function AnnouncementEditor({ data, onChange, onReset }: EditorProps<"announcement">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.announcement} onReset={onReset}>
      <Field label={ed.eyebrow} value={data.eyebrow} onChange={(eyebrow) => onChange({ ...data, eyebrow })} />
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label={ed.description}
        value={data.description}
        multiline
        onChange={(description) => onChange({ ...data, description })}
      />
    </Panel>
  );
}

function CoupleEditor({ data, onChange, onReset }: EditorProps<"couple">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.coupleIntro} onReset={onReset}>
      <Field label={ed.name1} value={data.name1} onChange={(name1) => onChange({ ...data, name1 })} />
      <Field label={ed.name2} value={data.name2} onChange={(name2) => onChange({ ...data, name2 })} />
      <Field
        label={ed.introduction}
        value={data.introText}
        multiline
        onChange={(introText) => onChange({ ...data, introText })}
      />
      <Field
        label={ed.parents}
        value={data.parentsText}
        multiline
        onChange={(parentsText) => onChange({ ...data, parentsText })}
      />
      <Field
        label={ed.godparents}
        value={data.godparentsText}
        multiline
        onChange={(godparentsText) => onChange({ ...data, godparentsText })}
      />
    </Panel>
  );
}

function StoryEditor({ data, onChange, onReset }: EditorProps<"story">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.ourStory} onReset={onReset}>
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label={ed.introduction}
        value={data.introduction}
        multiline
        onChange={(introduction) => onChange({ ...data, introduction })}
      />
      {data.items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{ed.momentN.replace("{n}", String(index + 1))}</p>
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
              >{dict.common.delete}</Button>
            </div>
          </div>
          <Field
            label={ed.date}
            value={item.date}
            onChange={(date) =>
              onChange({
                ...data,
                items: data.items.map((i) => (i.id === item.id ? { ...i, date } : i)),
              })
            }
          />
          <Field
            label={ed.title}
            value={item.title}
            onChange={(title) =>
              onChange({
                ...data,
                items: data.items.map((i) => (i.id === item.id ? { ...i, title } : i)),
              })
            }
          />
          <Field
            label={ed.description}
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
            label={ed.imageUrl}
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
        {ed.addMoment}
      </Button>
    </Panel>
  );
}

function CountdownEditor({ data, onChange, onReset }: EditorProps<"countdown">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.countdown} onReset={onReset}>
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label={ed.weddingDate}
        type="date"
        value={data.targetDate}
        onChange={(targetDate) => onChange({ ...data, targetDate })}
      />
    </Panel>
  );
}

function WhenWhereEditor({ data, onChange, onReset }: EditorProps<"when_where">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.whenWhere} onReset={onReset}>
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label={ed.date}
        type="date"
        value={data.weddingDate}
        onChange={(weddingDate) => onChange({ ...data, weddingDate })}
      />
      <Field
        label={ed.time}
        type="time"
        value={data.weddingTime}
        onChange={(weddingTime) => onChange({ ...data, weddingTime })}
      />
      <Field
        label={ed.ceremonyLocation}
        value={data.ceremonyLocation}
        onChange={(ceremonyLocation) => onChange({ ...data, ceremonyLocation })}
      />
      <Field
        label={ed.receptionLocation}
        value={data.receptionLocation}
        onChange={(receptionLocation) => onChange({ ...data, receptionLocation })}
      />
      <UrlField
        label={ed.mapUrl}
        value={data.mapUrl}
        onChange={(mapUrl) => onChange({ ...data, mapUrl })}
      />
    </Panel>
  );
}

function TimelineEditor({ data, onChange, onReset }: EditorProps<"timeline">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.eventSchedule} onReset={onReset}>
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      {data.items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{ed.eventN.replace("{n}", String(index + 1))}</p>
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
              >{dict.common.delete}</Button>
            </div>
          </div>
          {(
            [
              ["time", ed.time, "time"],
              ["title", ed.title, "text"],
              ["description", ed.description, "text"],
              ["location", ed.location, "text"],
              ["icon", ed.icon, "text"],
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
        {ed.addEvent}
      </Button>
    </Panel>
  );
}

function GalleryEditor({ data, onChange, onReset }: EditorProps<"gallery">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.gallery} onReset={onReset}>
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      {data.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {ed.galleryEmpty}
        </p>
      ) : null}
      {data.items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex justify-between gap-1">
            <p className="text-xs text-muted-foreground">{ed.imageN.replace("{n}", String(index + 1))}</p>
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
              >{dict.common.delete}</Button>
            </div>
          </div>
          <UrlField
            label={ed.imageUrl}
            value={item.url}
            onChange={(url) =>
              onChange({
                ...data,
                items: data.items.map((i) => (i.id === item.id ? { ...i, url } : i)),
              })
            }
          />
          <Field
            label={ed.caption}
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
        {ed.addImage}
      </Button>
    </Panel>
  );
}

function DressCodeEditor({ data, onChange, onReset }: EditorProps<"dress_code">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.dressCode} onReset={onReset}>
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label={ed.description}
        value={data.description}
        multiline
        onChange={(description) => onChange({ ...data, description })}
      />
      <div className="space-y-2">
        <Label>{ed.colorPalette}</Label>
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
            >{dict.common.delete}</Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...data, colors: [...data.colors, "#C4A574"] })}
        >
          {ed.addColor}
        </Button>
      </div>
      <UrlField
        label={ed.inspirationImage}
        value={data.inspirationImageUrl}
        onChange={(inspirationImageUrl) => onChange({ ...data, inspirationImageUrl })}
      />
    </Panel>
  );
}

function AccommodationEditor({ data, onChange, onReset }: EditorProps<"accommodation">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.accommodation} onReset={onReset}>
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label={ed.description}
        value={data.description}
        multiline
        onChange={(description) => onChange({ ...data, description })}
      />
      {data.items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">{ed.accommodationN.replace("{n}", String(index + 1))}</p>
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
            >{dict.common.delete}</Button>
          </div>
          {(
            [
              ["name", ed.name],
              ["address", ed.address],
              ["phone", ed.phone],
              ["bookingInfo", ed.bookingInfo],
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
            label={ed.website}
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
            label={ed.mapUrl}
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
        {ed.addAccommodation}
      </Button>
    </Panel>
  );
}

function TransportEditor({ data, onChange, onReset }: EditorProps<"transport">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.transport} onReset={onReset}>
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label={ed.description}
        value={data.description}
        multiline
        onChange={(description) => onChange({ ...data, description })}
      />
      <Field
        label={ed.pickupPoints}
        value={data.pickupPoints}
        multiline
        onChange={(pickupPoints) => onChange({ ...data, pickupPoints })}
      />
      <Field
        label={ed.departureTimes}
        value={data.departureTimes}
        onChange={(departureTimes) => onChange({ ...data, departureTimes })}
      />
      <Field
        label={ed.returnTimes}
        value={data.returnTimes}
        onChange={(returnTimes) => onChange({ ...data, returnTimes })}
      />
      <Field
        label={ed.contact}
        value={data.contact}
        onChange={(contact) => onChange({ ...data, contact })}
      />
    </Panel>
  );
}

function GiftsEditor({ data, onChange, onReset }: EditorProps<"gifts">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.gifts} onReset={onReset}>
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label={ed.description}
        value={data.description}
        multiline
        onChange={(description) => onChange({ ...data, description })}
      />
      <Field
        label={ed.bankDetails}
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
        {ed.hideBankDetails}
      </label>
      <UrlField
        label={ed.giftListUrl}
        value={data.registryUrl}
        onChange={(registryUrl) => onChange({ ...data, registryUrl })}
      />
    </Panel>
  );
}

function FaqEditor({ data, onChange, onReset }: EditorProps<"faq">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.faq} onReset={onReset}>
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      {data.items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">{ed.questionN.replace("{n}", String(index + 1))}</p>
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
              >{dict.common.delete}</Button>
            </div>
          </div>
          <Field
            label={ed.question}
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
            label={ed.answer}
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
        {ed.addQuestion}
      </Button>
    </Panel>
  );
}

function RsvpEditor({ data, onChange, onReset }: EditorProps<"rsvp">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.rsvpConfirm} onReset={onReset}>
      <Field label={ed.title} value={data.title} onChange={(title) => onChange({ ...data, title })} />
      <Field
        label={ed.message}
        value={data.message}
        multiline
        onChange={(message) => onChange({ ...data, message })}
      />
    </Panel>
  );
}

function FooterEditor({ data, onChange, onReset }: EditorProps<"footer">) {
  const ed = useEditorDict();
  const { dict } = useI18n();
  return (
    <Panel title={ed.closing} onReset={onReset}>
      <Field label={ed.text} value={data.text} onChange={(text) => onChange({ ...data, text })} />
      <Field
        label={ed.signature}
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
