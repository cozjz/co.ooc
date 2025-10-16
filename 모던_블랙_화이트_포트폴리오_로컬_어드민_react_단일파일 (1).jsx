import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Settings, Upload, Download, LogIn, LogOut, Images, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

/**
 * 모던 화이트&블랙 포트폴리오 + 로컬 어드민 (단일 파일)
 * - Admin에서 Hero/About/Contact/Projects 전체 수정/추가/삭제 가능 (localStorage 저장)
 * - 프로젝트 클릭 시 팝업(Modal) → 현장별 섹션(Tabs) → 썸네일 클릭 시 라이트박스(큰 이미지)
 * - ESC: 라이트박스(이미지)만 닫힘. Modal(프로젝트 팝업)은 유지됨
 * - 애니메이션: Framer Motion 적용 (페이드/슬라이드)
 * - 톤: 모던, 미니멀, 블랙&화이트
 *
 * 사용법
 * 1) 우상단 "Admin"을 눌러 로그인(임시 비번: 0000)
 * 2) Site Settings/Projects에서 수정 후 "저장" 누르면 로컬에 보관됨
 * 3) Import/Export로 설정 백업 가능
 */

// -------------------------------
// 유틸
// -------------------------------
const LS_KEY = "modern_portfolio_site_v1";
const DEMO = {
  site: {
    heroTitle: "SUNGJOON – Interior & Design",
    heroSubtitle:
      "Space tells stories. I shape those stories into architecture and interiors.",
    about:
      "안녕하세요, 성준입니다. 인테리어 설계와 현장 경험을 토대로 기능과 미학이 공존하는 공간을 만듭니다. 비용, 일정, 품질을 한 화면에서 관리하듯, 디자인도 처음부터 끝까지 정밀하게 설계합니다.",
    contactEmail: "contact@yourdomain.com",
    contactNote: "프로젝트 문의는 이메일로 편하게 남겨주세요.",
    socials: {
      instagram: "https://instagram.com/",
      behance: "https://behance.net/",
      github: "https://github.com/",
    },
  },
  projects: [
    {
      id: cryptoId(),
      title: "DR365 – 카운터 & 월 디스플레이",
      client: "dr365",
      year: "2025",
      tags: ["Retail", "Cosmetics", "Detail"],
      cover:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop",
      brief:
        "1200x2300x450 사이즈 제안. 일본식 미니멀 디테일과 모듈화된 수납/디스플레이 시스템.",
      sections: [
        {
          name: "카운터 존",
          images: [
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1523419409543-a5e549c1a9c0?q=80&w=1600&auto=format&fit=crop",
          ],
        },
        {
          name: "월 디스플레이",
          images: [
            "https://images.unsplash.com/photo-1522199755839-a2bacb67c546?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1600&auto=format&fit=crop",
          ],
        },
      ],
    },
    {
      id: cryptoId(),
      title: "Phone Store – 모듈형 진열",
      client: "Local Telco",
      year: "2024",
      tags: ["Retail", "Modular", "Lighting"],
      cover:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
      brief:
        "가변 진열 모듈과 라인 조명으로 유연한 VMD 시나리오 지원. 유지보수 용이성 최대화.",
      sections: [
        {
          name: "입구/히어로",
          images: [
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1600&auto=format&fit=crop",
          ],
        },
        {
          name: "체험존",
          images: [
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1481277542470-605612bd2d61?q=80&w=1600&auto=format&fit=crop",
          ],
        },
      ],
    },
  ],
};

function cryptoId() {
  return (globalThis.crypto?.randomUUID?.() || `id_${Math.random().toString(36).slice(2)}`);
}

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEMO;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.warn("Load failed, fallback to DEMO", e);
    return DEMO;
  }
}

function saveData(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Save failed", e);
  }
}

// -------------------------------
// 라이트박스(이미지 확대)
// -------------------------------
function Lightbox({ src, onClose, onPrev, onNext }) {
  // ESC로 라이트박스만 닫힘
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" onClick={onClose} aria-label="Close image" />
          <motion.img
            key={src}
            src={src}
            alt="expanded"
            className="relative max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl select-none"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <Button variant="secondary" onClick={onPrev} className="rounded-full w-10 h-10 p-0">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="secondary" onClick={onClose} className="rounded-full w-10 h-10 p-0" aria-label="Close image">
              <X className="w-5 h-5" />
            </Button>
            <Button variant="secondary" onClick={onNext} className="rounded-full w-10 h-10 p-0">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// -------------------------------
// 프로젝트 모달 (섹션 탭 + 이미지 썸네일)
// -------------------------------
function ProjectModal({ project, onClose }) {
  const [activeTab, setActiveTab] = useState(project?.sections?.[0]?.name || "");
  const [lightboxIndex, setLightboxIndex] = useState(null); // 현재 섹션 내 이미지 인덱스

  const currentSection = useMemo(
    () => project?.sections?.find((s) => s.name === activeTab) || project?.sections?.[0],
    [project, activeTab]
  );

  const currentImage = useMemo(() => {
    if (lightboxIndex == null) return null;
    return currentSection?.images?.[lightboxIndex] || null;
  }, [lightboxIndex, currentSection]);

  useEffect(() => {
    const onKey = (e) => {
      // ESC는 라이트박스만 닫음. 모달은 유지
      if (e.key === "Escape" && lightboxIndex == null) {
        // 라이트박스가 없을 때에는 모달 자체는 닫지 않음
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex]);

  if (!project) return null;

  const handlePrev = () => {
    if (!currentSection?.images?.length) return;
    setLightboxIndex((idx) => (idx == null ? 0 : (idx - 1 + currentSection.images.length) % currentSection.images.length));
  };
  const handleNext = () => {
    if (!currentSection?.images?.length) return;
    setLightboxIndex((idx) => (idx == null ? 0 : (idx + 1) % currentSection.images.length));
  };

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-6xl bg-white text-black rounded-2xl shadow-2xl border border-black/10 overflow-hidden"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-semibold">{project.title}</h3>
                <p className="text-sm text-black/60 mt-0.5">{project.client} · {project.year}</p>
              </div>
              <Button variant="ghost" onClick={onClose} className="rounded-full" aria-label="Close project">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              <div className="lg:col-span-1 border-r border-black/10 p-6"> 
                <p className="text-sm leading-relaxed text-black/80 whitespace-pre-line">{project.brief}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags?.map((t) => (
                    <span key={t} className="text-xs tracking-wide uppercase border border-black/20 px-2 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-black/5">
                    {(project.sections || []).map((s) => (
                      <TabsTrigger key={s.name} value={s.name} className="data-[state=active]:bg-black data-[state=active]:text-white">
                        {s.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {(project.sections || []).map((s) => (
                    <TabsContent key={s.name} value={s.name} className="mt-4">
                      {s.images?.length ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {s.images.map((src, i) => (
                            <motion.button
                              key={src}
                              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-black/10 bg-white"
                              onClick={() => setLightboxIndex(i)}
                              whileHover={{ scale: 1.01 }}
                            >
                              <img src={src} alt="thumb" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/10" />
                            </motion.button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-black/50">이미지가 없습니다.</p>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>

            {/* 라이트박스 (ESC로 이미지만 닫힘) */}
            <Lightbox
              src={currentImage}
              onClose={() => setLightboxIndex(null)}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// -------------------------------
// Admin 패널 (로그인 → 설정/프로젝트 관리)
// -------------------------------
function AdminPanel({ open, onClose, data, setData }) {
  const [tab, setTab] = useState("site");
  const [raw, setRaw] = useState("");

  useEffect(() => {
    setRaw(JSON.stringify(data, null, 2));
  }, [data]);

  const updateSite = (path, value) => {
    const next = { ...data, site: { ...data.site, [path]: value } };
    setData(next);
  };

  const updateSocial = (key, value) => {
    const next = { ...data, site: { ...data.site, socials: { ...(data.site.socials||{}), [key]: value } } };
    setData(next);
  };

  const addProject = () => {
    const p = {
      id: cryptoId(),
      title: "New Project",
      client: "Client",
      year: new Date().getFullYear().toString(),
      tags: ["Tag"],
      cover: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1600&auto=format&fit=crop",
      brief: "프로젝트 간단 설명",
      sections: [{ name: "섹션 1", images: [] }],
    };
    const next = { ...data, projects: [p, ...(data.projects || [])] };
    setData(next);
  };

  const removeProject = (id) => {
    const next = { ...data, projects: data.projects.filter((p) => p.id !== id) };
    setData(next);
  };

  const updateProject = (id, patch) => {
    const next = {
      ...data,
      projects: data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    };
    setData(next);
  };

  const addSection = (id) => {
    const next = {
      ...data,
      projects: data.projects.map((p) =>
        p.id === id ? { ...p, sections: [...(p.sections || []), { name: `섹션 ${p.sections.length + 1}`, images: [] }] } : p
      ),
    };
    setData(next);
  };

  const removeSection = (id, idx) => {
    const next = {
      ...data,
      projects: data.projects.map((p) =>
        p.id === id ? { ...p, sections: p.sections.filter((_, i) => i !== idx) } : p
      ),
    };
    setData(next);
  };

  const addImageToSection = (id, idx, url) => {
    const next = {
      ...data,
      projects: data.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              sections: p.sections.map((s, i) => (i === idx ? { ...s, images: [...(s.images || []), url] } : s)),
            }
          : p
      ),
    };
    setData(next);
  };

  const removeImageFromSection = (id, idx, imgIdx) => {
    const next = {
      ...data,
      projects: data.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              sections: p.sections.map((s, i) => (i === idx ? { ...s, images: s.images.filter((_, j) => j !== imgIdx) } : s)),
            }
          : p
      ),
    };
    setData(next);
  };

  const onSave = () => {
    saveData(data);
    onClose?.();
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio_config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file) => {
    if (!file) return;
    const text = await file.text();
    const json = JSON.parse(text);
    setData(json);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-6xl bg-white text-black rounded-2xl border border-black/10 overflow-hidden max-h-[85vh] flex flex-col"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-white">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <h3 className="text-lg font-semibold">Admin</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onExport}><Download className="w-4 h-4 mr-1"/>Export</Button>
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm border px-3 py-2 rounded-md">
                  <Upload className="w-4 h-4"/> Import
                  <input type="file" className="hidden" accept="application/json" onChange={(e) => onImport(e.target.files?.[0])} />
                </label>
                <Button onClick={onSave}>저장</Button>
                <Button variant="ghost" onClick={onClose}><X className="w-4 h-4"/></Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="bg-black/5 mb-4">
                  <TabsTrigger value="site" className="data-[state=active]:bg-black data-[state=active]:text-white">Site Settings</TabsTrigger>
                  <TabsTrigger value="projects" className="data-[state=active]:bg-black data-[state=active]:text-white">Projects</TabsTrigger>
                  <TabsTrigger value="raw" className="data-[state=active]:bg-black data-[state=active]:text-white">Raw JSON</TabsTrigger>
                </TabsList>

                <TabsContent value="site" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Hero Title</Label>
                      <Input value={data.site.heroTitle} onChange={(e) => updateSite("heroTitle", e.target.value)} />
                    </div>
                    <div>
                      <Label>Hero Subtitle</Label>
                      <Input value={data.site.heroSubtitle} onChange={(e) => updateSite("heroSubtitle", e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>About</Label>
                      <Textarea rows={5} value={data.site.about} onChange={(e) => updateSite("about", e.target.value)} />
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <Input value={data.site.contactEmail} onChange={(e) => updateSite("contactEmail", e.target.value)} />
                    </div>
                    <div>
                      <Label>Contact Note</Label>
                      <Input value={data.site.contactNote} onChange={(e) => updateSite("contactNote", e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Instagram</Label>
                      <Input value={data.site.socials?.instagram || ""} onChange={(e) => updateSocial("instagram", e.target.value)} />
                    </div>
                    <div>
                      <Label>Behance</Label>
                      <Input value={data.site.socials?.behance || ""} onChange={(e) => updateSocial("behance", e.target.value)} />
                    </div>
                    <div>
                      <Label>GitHub</Label>
                      <Input value={data.site.socials?.github || ""} onChange={(e) => updateSocial("github", e.target.value)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="projects">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">프로젝트 목록</h4>
                    <Button onClick={addProject}><Plus className="w-4 h-4 mr-1"/>Add Project</Button>
                  </div>
                  <div className="space-y-4">
                    {data.projects.map((p, idx) => (
                      <Card key={p.id} className="border-black/10">
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                          <CardTitle className="text-base">{p.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => removeProject(p.id)}>
                              <Trash2 className="w-4 h-4"/>
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Title</Label>
                            <Input value={p.title} onChange={(e) => updateProject(p.id, { title: e.target.value })} />
                          </div>
                          <div>
                            <Label>Client</Label>
                            <Input value={p.client} onChange={(e) => updateProject(p.id, { client: e.target.value })} />
                          </div>
                          <div>
                            <Label>Year</Label>
                            <Input value={p.year} onChange={(e) => updateProject(p.id, { year: e.target.value })} />
                          </div>
                          <div className="md:col-span-3">
                            <Label>Tags (comma)</Label>
                            <Input
                              value={(p.tags || []).join(", ")}
                              onChange={(e) => updateProject(p.id, { tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Label>Cover URL</Label>
                            <Input value={p.cover} onChange={(e) => updateProject(p.id, { cover: e.target.value })} />
                          </div>
                          <div className="md:col-span-3">
                            <Label>Brief</Label>
                            <Textarea rows={3} value={p.brief} onChange={(e) => updateProject(p.id, { brief: e.target.value })} />
                          </div>

                          <div className="md:col-span-3 border-t pt-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">현장 섹션</h5>
                              <Button size="sm" variant="secondary" onClick={() => addSection(p.id)}><Plus className="w-4 h-4 mr-1"/>섹션 추가</Button>
                            </div>
                            <div className="mt-3 space-y-4">
                              {(p.sections || []).map((s, sidx) => (
                                <div key={sidx} className="border border-black/10 rounded-lg p-3">
                                  <div className="flex items-center gap-2">
                                    <Label className="w-24">섹션명</Label>
                                    <Input value={s.name} onChange={(e) => {
                                      const next = { ...p };
                                      next.sections = next.sections.map((ss, i) => i===sidx ? { ...ss, name: e.target.value } : ss);
                                      updateProject(p.id, next);
                                    }} />
                                    <Button size="icon" variant="ghost" onClick={() => removeSection(p.id, sidx)}><Trash2 className="w-4 h-4"/></Button>
                                  </div>
                                  <div className="mt-2">
                                    <Label>이미지 URL 추가</Label>
                                    <div className="flex gap-2 mt-1">
                                      <Input placeholder="https://..." id={`img-${p.id}-${sidx}`} />
                                      <Button onClick={() => {
                                        const el = document.getElementById(`img-${p.id}-${sidx}`);
                                        const url = el?.value?.trim();
                                        if (!url) return;
                                        addImageToSection(p.id, sidx, url);
                                        el.value = "";
                                      }}>추가</Button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-3">
                                      {(s.images||[]).map((src, i) => (
                                        <div key={i} className="relative group">
                                          <img src={src} alt="thumb" className="aspect-square object-cover rounded-md border border-black/10"/>
                                          <button
                                            className="absolute top-1 right-1 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                            onClick={() => removeImageFromSection(p.id, sidx, i)}
                                          >
                                            <Trash2 className="w-3 h-3"/>
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="raw">
                  <Textarea rows={16} value={raw} onChange={(e) => setRaw(e.target.value)} className="font-mono" />
                  <div className="mt-2 flex justify-end">
                    <Button onClick={() => {
                      try {
                        const json = JSON.parse(raw);
                        setData(json);
                      } catch (e) {
                        alert("JSON 파싱 오류: 형식을 확인하세요.");
                      }
                    }}>JSON 적용</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// -------------------------------
// 로그인 패널 (아주 단순)
// -------------------------------
function LoginModal({ open, onClose, onOK }) {
  const [pw, setPw] = useState("");
  const submit = () => {
    if (pw === "0000") onOK();
    else alert("비밀번호가 올바르지 않습니다. (힌트: 0000)");
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="w-full max-w-sm bg-white rounded-2xl border border-black/10 p-5"
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }}
          >
            <h3 className="text-lg font-semibold">Admin Login</h3>
            <p className="text-sm text-black/60 mt-1">임시 비밀번호: 0000</p>
            <div className="mt-4 space-y-2">
              <Label>비밀번호</Label>
              <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>취소</Button>
              <Button onClick={submit}><LogIn className="w-4 h-4 mr-1"/>로그인</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// -------------------------------
// 메인 앱
// -------------------------------
export default function PortfolioApp() {
  const [data, setData] = useState(loadData());
  const [projectOpen, setProjectOpen] = useState(null); // project object
  const [adminOpen, setAdminOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const openAdmin = () => {
    if (!loggedIn) setLoginOpen(true);
    else setAdminOpen(true);
  };

  const onLoginOK = () => {
    setLoggedIn(true);
    setLoginOpen(false);
    setAdminOpen(true);
  };

  const projects = data.projects || [];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="#" className="font-semibold tracking-tight">SUNGJOON PORTFOLIO</a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#projects" className="hover:opacity-70">Projects</a>
            <a href="#about" className="hover:opacity-70">About</a>
            <a href="#contact" className="hover:opacity-70">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            {loggedIn ? (
              <Button size="sm" variant="outline" onClick={() => setAdminOpen(true)}>
                <Settings className="w-4 h-4 mr-1"/> Admin
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={openAdmin}>
                <Settings className="w-4 h-4 mr-1"/> Admin
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <motion.h1
          className="text-3xl md:text-5xl font-semibold tracking-tight"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {data.site.heroTitle}
        </motion.h1>
        <motion.p
          className="text-black/60 mt-4 text-lg max-w-3xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
        >
          {data.site.heroSubtitle}
        </motion.p>
      </section>

      {/* Projects */}
      <section id="projects" className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-sm text-black/60">클릭하면 상세 팝업이 열립니다.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p, i) => (
            <motion.button
              key={p.id}
              className="group text-left"
              onClick={() => setProjectOpen(p)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <img src={p.cover} alt={p.title} className="aspect-[16/10] w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{p.title}</h3>
                    <span className="text-xs text-black/60">{p.year}</span>
                  </div>
                  <p className="text-sm text-black/60 mt-1 line-clamp-2">{p.brief}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {(p.tags||[]).map((t) => (
                      <span key={t} className="text-[11px] uppercase tracking-wide border border-black/15 px-2 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-6xl mx-auto px-4 py-16 border-t border-black/10">
        <h2 className="text-xl font-semibold">About</h2>
        <p className="text-black/80 mt-3 max-w-3xl leading-relaxed whitespace-pre-line">{data.site.about}</p>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-6xl mx-auto px-4 py-16 border-t border-black/10">
        <h2 className="text-xl font-semibold">Contact</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-black/10">
            <CardContent className="p-5">
              <p className="text-sm text-black/70">{data.site.contactNote}</p>
              <a href={`mailto:${data.site.contactEmail}`} className="inline-block mt-3 underline underline-offset-4">{data.site.contactEmail}</a>
              <div className="flex gap-4 mt-4 text-sm">
                {data.site.socials?.instagram && <a className="hover:opacity-70" href={data.site.socials.instagram} target="_blank" rel="noreferrer">Instagram</a>}
                {data.site.socials?.behance && <a className="hover:opacity-70" href={data.site.socials.behance} target="_blank" rel="noreferrer">Behance</a>}
                {data.site.socials?.github && <a className="hover:opacity-70" href={data.site.socials.github} target="_blank" rel="noreferrer">GitHub</a>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardContent className="p-5">
              <form onSubmit={(e) => { e.preventDefault(); alert("데모 양식입니다. 메일 링크를 사용해주세요."); }} className="space-y-3">
                <div>
                  <Label>이름</Label>
                  <Input required placeholder="Your name"/>
                </div>
                <div>
                  <Label>이메일</Label>
                  <Input type="email" required placeholder="you@example.com"/>
                </div>
                <div>
                  <Label>메시지</Label>
                  <Textarea required rows={4} placeholder="프로젝트 문의 내용을 적어주세요."/>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Send</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="py-10 border-t border-black/10 text-center text-xs text-black/60">
        © {new Date().getFullYear()} SUNGJOON. All rights reserved.
      </footer>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onOK={onLoginOK} />
      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} data={data} setData={setData} />
      <ProjectModal project={projectOpen} onClose={() => setProjectOpen(null)} />
    </div>
  );
}
