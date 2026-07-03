"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Upload, Check } from "lucide-react";

interface Profile {
  nickname: string;
  email: string;
  bio: string;
  avatar_url: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({ nickname: "", email: "", bio: "", avatar_url: "" });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/api/v1/profile");
        const json = await res.json();
        if (json.code === 0 && json.data) {
          setProfile({
            nickname: json.data.nickname || "",
            email: json.data.email || "",
            bio: json.data.bio || "",
            avatar_url: json.data.avatar_url || "",
          });
        }
      } catch {
        setToast({ type: "error", message: "加载个人信息失败" });
      }
      setLoaded(true);
    })();
  }, []);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: "error", message: "文件大小不能超过 2MB" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api("/api/v1/profile/avatar", { method: "POST", body: formData });
      const json = await res.json();
      if (json.code === 0 && json.data) {
        setProfile((p) => ({ ...p, avatar_url: json.data.avatar_url }));
        setToast({ type: "success", message: "头像已更新" });
      } else {
        setToast({ type: "error", message: json.message || "上传失败" });
      }
    } catch {
      setToast({ type: "error", message: "网络错误，请重试" });
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await api("/api/v1/profile", {
        method: "PUT",
        body: JSON.stringify({
          nickname: profile.nickname,
          email: profile.email,
          bio: profile.bio,
        }),
      });
      const json = await res.json();
      if (json.code === 0) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setToast({ type: "error", message: json.message || "保存失败" });
      }
    } catch {
      setToast({ type: "error", message: "网络错误，请重试" });
    }
    setSaving(false);
  }

  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="系统设置" description="管理你的账户信息和偏好。" />

      {toast && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          toast.type === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          <span className="flex-1">{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="text-current opacity-50 hover:opacity-100">&times;</button>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">个人信息</h3>
          <p className="text-sm text-gray-500 mt-0.5">你的个人资料将用于显示和联系。</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-white">
                    {(profile.nickname?.[0] || "管")}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                {uploading ? (
                  <span className="h-3.5 w-3.5 block rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5 text-gray-500" />
                )}
                <input type="file" accept="image/jpeg,image/png" onChange={handleAvatar} className="hidden" disabled={uploading} />
              </label>
            </div>
            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-700">头像</p>
              <p className="text-xs mt-0.5">支持 JPG、PNG，最大 2MB</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <input type="text" value={profile.nickname} placeholder="请设置昵称"
              onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))}
              className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input type="email" value={profile.email} placeholder="请设置邮箱"
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
            <textarea value={profile.bio} placeholder="请设置个人简介"
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={3}
              className="block w-full max-w-lg rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none resize-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button onClick={handleSave} disabled={saving || !loaded}
          className="flex items-center gap-2 rounded-lg bg-slate-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-500 transition-colors disabled:opacity-50">
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              已保存
            </>
          ) : saving ? (
            <span className="h-4 w-4 block rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            "保存设置"
          )}
        </button>
      </div>
    </div>
  );
}
