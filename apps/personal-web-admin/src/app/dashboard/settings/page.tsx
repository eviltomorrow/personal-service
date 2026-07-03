"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Upload, Check } from "lucide-react";

interface Profile {
  nickname: string;
  email: string;
  bio: string;
  avatarDataUrl?: string;
}

function loadProfile(): Profile {
  if (typeof window === "undefined") return { nickname: "管理员", email: "", bio: "" };
  try {
    const data = localStorage.getItem("settings-profile");
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return { nickname: "管理员", email: "admin@example.com", bio: "这个用户很懒，什么都没有写。" };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({ nickname: "", email: "", bio: "" });
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setLoaded(true);
    const reg = localStorage.getItem("settings-registration");
    if (reg !== null) setRegistrationEnabled(reg === "true");
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("settings-profile", JSON.stringify(profile));
  }, [profile, loaded]);

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setProfile((p) => ({ ...p, avatarDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function handleSave() {
    localStorage.setItem("settings-registration", JSON.stringify(registrationEnabled));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8 anim-in anim-fade anim-up" style={{ animationDuration: "500ms" }}>
      <PageHeader title="系统设置" description="管理你的账户信息和偏好。" />

      {/* Profile section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">个人信息</h3>
          <p className="text-sm text-gray-500 mt-0.5">你的个人资料将用于显示和联系。</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                {profile.avatarDataUrl ? (
                  <img src={profile.avatarDataUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold text-white">
                    {(profile.nickname?.[0] || "管")}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                <Upload className="h-3.5 w-3.5 text-gray-500" />
                <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
              </label>
            </div>
            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-700">头像</p>
              <p className="text-xs mt-0.5">支持 JPG、PNG，最大 2MB</p>
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <input type="text" value={profile.nickname}
              onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))}
              className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input type="email" value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none" />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
            <textarea value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={3}
              className="block w-full max-w-lg rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200/60 focus:outline-none resize-none" />
          </div>
        </div>
      </div>

      {/* System options section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">系统选项</h3>
          <p className="text-sm text-gray-500 mt-0.5">管理系统的全局功能开关。</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Registration toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">开放注册</label>
              <p className="text-xs text-gray-500 mt-0.5">允许新用户自行注册账户</p>
            </div>
            <button
              onClick={() => setRegistrationEnabled(!registrationEnabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
                registrationEnabled
                  ? "border-slate-400 bg-slate-500"
                  : "border-gray-300 bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  registrationEnabled ? "translate-x-[1.375rem]" : "translate-x-[0.1875rem]"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save indicator */}
      <div className="flex items-center justify-end">
        <button onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-slate-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-500 transition-colors">
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              已保存
            </>
          ) : (
            "保存设置"
          )}
        </button>
      </div>
    </div>
  );
}
