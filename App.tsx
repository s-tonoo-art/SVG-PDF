<<<<<<< HEAD
import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import heic2any from 'heic2any';
import { marked } from 'marked';
import JSZip from 'jszip';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Upload, FileText, X, History, Download, Menu, 
  Scissors, RefreshCw, Link as LinkIcon, Mail, 
  HelpCircle, MessageSquare, Plus, Copy, CheckCircle2,
  GripVertical, Edit3, ChevronRight, Play
} from 'lucide-react';

interface FileItem {
    id: string;
    file: File;
    preview: string | null;
    type: string;
    rotation: number;
    pageNum?: number;
    totalPage?: number;
    originalName?: string;
}

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const APP_VERSION = "v3.8.1";
const CHANGE_LOGS = [
    { version: "v3.8.0", date: "2024-06-12", title: "Gemini OCR 搭載", details: ["画像からテキストや表を抽出するOCR機能を追加。","Gemini 3 Flashによる高精度な文字起こし。"] },
    { version: "v3.7.0", date: "2024-06-11", title: "JPEG/PNG画像サポート", details: ["JPEG/JPG/PNG画像をPDFへ直接結合できる機能を追加。","画像ファイルのプレビュー表示をサポート。"] },
    { version: "v3.6.0", date: "2024-06-10", title: "HEIC/HEIF対応", details: ["iPhone等で撮影されたHEIC画像をドロップ可能に。","HEICからJPEG/PDFへの一括変換をサポート。"] }
];

// --- Components ---

const Ostrich = ({ isActive, isLaying, isSearching, enabled = true, animationsEnabled = true }: { isActive: boolean, isLaying: boolean, isSearching: boolean, enabled?: boolean, animationsEnabled?: boolean }) => {
    if (!enabled) return null;
    const statusClass = isActive ? 'running' : (isSearching ? 'searching' : (isLaying ? 'laying' : 'sleeping'));
    
    return (
        <div className={`ostrich-wrapper ${isActive ? 'ostrich-active' : ''} ${!animationsEnabled ? 'no-animation' : ''}`}>
            <div className={`ostrich-sprite ${statusClass}`}>
                <svg viewBox="0 -65 120 200" xmlns="http://www.w3.org/2000/svg">
                    {isLaying && (
                        <g>
                            <ellipse className="egg-element" cx="45" cy="80" rx="8" ry="11" />
                            <circle className="sparkle-effect" cx="45" cy="125" r="3" />
                        </g>
                    )}
                    <g className="leg-group">
                        <path className="ostrich-skin" d="M42 85 L38 125" strokeWidth="4.5" strokeLinecap="round" stroke="#e2ccb5" fill="none" />
                        <path className="ostrich-skin" d="M58 85 L62 125" strokeWidth="4.5" strokeLinecap="round" stroke="#e2ccb5" fill="none" />
                        <path d="M38 125 L32 125 M62 125 L68 125" stroke="#e2ccb5" strokeWidth="3" strokeLinecap="round" />
                    </g>
                    <ellipse className="ostrich-body-main" cx="50" cy="70" rx="40" ry="28" />
                    <circle cx="25" cy="60" r="10" className="ostrich-body-main" />
                    <circle cx="75" cy="65" r="12" className="ostrich-body-main" />
                    <path className="ostrich-tail" d="M12 70 Q5 60 0 70 Q5 85 12 75" fill="#fff" opacity="0.9" />
                    <g className="neck-group" style={{ transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', transformOrigin: '72px 55px' }}>
                        <path className="ostrich-skin" d="M72 55 C82 30, 78 -5, 92 0" strokeWidth="8" fill="none" stroke="#e2ccb5" strokeLinecap="round" />
                        <circle className="ostrich-skin" cx="92" cy="0" r="7" />
                        <circle className="ostrich-eye-white" cx="93" cy="-2" r="3.5" />
                        <circle className="ostrich-eye-pupil" cx="93.5" cy="-2.2" r={isSearching ? 2.5 : 1.8} />
                        <path className="ostrich-beak" d="M96 0 L108 2 L96 4 Z" fill="#fbbf24" />
                    </g>
                </svg>
            </div>
        </div>
    );
};

const OstrichEggButton = ({ onClick }: { onClick: () => void }) => {
    const [isCracking, setIsCracking] = useState(false);

    const handleClick = () => {
        setIsCracking(true);
        setTimeout(() => {
            onClick();
            setIsCracking(false);
        }, 800);
    };

    return (
        <button 
            onClick={handleClick}
            className={`fixed top-6 right-6 z-[60] group transition-transform hover:scale-110 active:scale-95 ${isCracking ? 'pointer-events-none' : ''}`}
            title="取扱説明書"
        >
            <div className={`relative ${isCracking ? 'cracking' : ''}`}>
                <svg width="100" height="120" viewBox="-10 -10 100 120" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
                    <g className="egg-upper">
                        <path d="M10 50 C10 20 30 5 50 5 C70 5 90 20 90 50 L90 55 L75 45 L60 55 L45 45 L30 55 L15 45 L10 55 Z" 
                              fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" transform="translate(-10, 0)" />
                    </g>
                    <g className="egg-lower">
                        <path d="M10 50 C10 80 30 95 50 95 C70 95 90 80 90 50 L90 45 L75 55 L60 45 L45 55 L30 45 L15 55 L10 45 Z" 
                              fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" transform="translate(-10, 0)" />
                    </g>
                </svg>
                {!isCracking && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[14px] w-8 h-8 flex items-center justify-center rounded-full opacity-100 group-hover:bg-indigo-700 transition-all whitespace-nowrap font-black shadow-lg border-2 border-white">
                        ?
                    </div>
                )}
            </div>
        </button>
    );
};

const ManualModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-6" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20" 
                onClick={e => e.stopPropagation()}
            >
                <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                            <svg width="30" height="40" viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
                                <ellipse cx="30" cy="40" rx="25" ry="35" fill="#fffaf0" stroke="#e2ccb5" strokeWidth="2" />
                                <path d="M10 40 L20 35 L30 40 L40 35 L50 40" fill="none" stroke="#e2ccb5" strokeWidth="1" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">取扱説明書</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ostrich Egg Manual</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-8 h-8 text-slate-400" />
                    </button>
                </div>
                <div className="p-10 overflow-y-auto space-y-10">
                    <section>
                        <h3 className="text-xl font-black text-indigo-600 mb-5 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs shadow-sm">1</span>
                            結合・変換モード
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-slate-600 font-medium leading-relaxed">
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-colors">
                                <p className="font-black text-slate-800 mb-3 text-base">PDFに結合</p>
                                <p>複数のSVG、PDF、画像（JPEG/PNG/HEIC）を1つのPDFファイルにまとめます。ドラッグ＆ドロップで順番を自由に入れ替え可能です。</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-colors">
                                <p className="font-black text-slate-800 mb-3 text-base">画像に変換</p>
                                <p>PDFやSVGを1ページ（1枚）ずつ画像として書き出します。大量のファイルを一括で処理するのに最適です。</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-indigo-600 mb-5 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs shadow-sm">2</span>
                            PDF分割モード
                        </h3>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm text-slate-600 font-medium leading-relaxed hover:border-indigo-200 transition-colors">
                            <p>1つのPDFファイルをページごとにバラバラのPDFファイルとして保存します。特定のページだけ抽出したい場合に便利です。</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-indigo-600 mb-5 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs shadow-sm">3</span>
                            OCR (文字起こし)
                        </h3>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm text-slate-600 font-medium leading-relaxed hover:border-indigo-200 transition-colors">
                            <p className="mb-3">画像をドロップすると、Gemini AIがテキストや表を抽出します。手書き文字や複雑なレイアウトの表も高精度で読み取ります。</p>
                            <p className="text-xs text-slate-400 font-bold">※「AIRAG解析」や「設計チェック」がOFFの場合に実行されます。</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-indigo-600 mb-5 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs shadow-sm">4</span>
                            AIRAG解析 (高度解析)
                        </h3>
                        <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 text-sm text-slate-600 font-medium leading-relaxed hover:border-indigo-200 transition-colors">
                            <p className="mb-3 font-black text-indigo-700">外部データベース（RAG）と連携した、最も高度な解析機能です。</p>
                            <p>画面上部の「AIRAG解析」をONにすると、外部から取得した最新の局情報と図面を照らし合わせ、データの不一致や整合性を詳細にチェックします。出力は設計チェックレポートの形式で行われます。</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-emerald-600 mb-5 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-xs shadow-sm">5</span>
                            設計チェック機能 & 通知
                        </h3>
                        <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 text-sm text-slate-600 font-medium leading-relaxed hover:border-emerald-200 transition-colors">
                            <p className="mb-3 font-black text-emerald-700">通信基地局の設計図面レビューに特化した専門機能です。</p>
                            <p className="mb-4">画面上部の「設計チェック」をONにすると、結合・分割・OCRのどの操作時でも、AIが図面の内容（局名、設備数、仮設計画など）を自動で解析し、指摘事項をレポートとして出力します。特に「局番号・局名の一致」「図番の連番性」「凡例ルール（新設＝赤/撤去＝青）」などを重点的にチェックします。</p>
                            
                            <div className="bg-white/60 p-5 rounded-2xl border border-emerald-100/50 space-y-3">
                                <p className="font-black text-emerald-800 text-xs uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    設計チェックON時の特別通知
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-[13px]">
                                    <li><span className="font-bold">タブタイトルの変化:</span> 処理中は「処理中…」、完了すると「完了 ●」にタイトルとアイコンが変わります。</li>
                                    <li><span className="font-bold">サウンド通知:</span> 完了時に「ピコーン」と音が鳴ります。</li>
                                    <li><span className="font-bold">ブラウザ通知:</span> 別タブを開いていても、完了時にデスクトップ通知でお知らせします。</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] shadow-inner">
                        <h4 className="font-black text-amber-800 text-base mb-3 flex items-center gap-3">
                            <HelpCircle className="w-5 h-5" />
                            ヒント
                        </h4>
                        <p className="text-sm text-amber-700 font-bold leading-relaxed">
                            iPhoneで撮影した写真（HEIC形式）もそのまま放り込んでOK！自動的にJPEGに変換して処理します。ダチョウが走っている間は処理中です。卵を産んだら完了の合図です。設計チェックON時は、タブタイトルやサウンド、ブラウザ通知でも完了をお知らせします。
                        </p>
                    </div>

                    <section className="pt-4">
                        <h3 className="text-xl font-black text-indigo-600 mb-6 flex items-center gap-3">
                            <MessageSquare className="w-6 h-6" />
                            よくあるご質問 (Q&A)
                        </h3>
                        <div className="space-y-4">
                            {[
                                { q: "処理が途中で止まってしまったら？", a: "右下の「停止」ボタンを押して一度リセットし、再度ファイルを投入してください。" },
                                { q: "一度に何個までファイルを入れられますか？", a: "特に制限はありませんが、数が多い場合は処理に時間がかかることがあります。" },
                                { q: "OCR（文字起こし）がうまくいかない...", a: "画像が鮮明であることを確認してください。Gemini AIが複雑なレイアウトも解析しますが、極端に暗い画像やボケた画像は苦手です。" },
                                { q: "結合したPDFの順番を入れ替えたい", a: "画面上のファイルカードをドラッグ＆ドロップすることで、自由に順番を入れ替えることができます。" },
                                { q: "保存先はどこですか？", a: "ブラウザの「ダウンロード」フォルダに保存されます。複数のファイルを書き出す場合は、1つのZIPファイルにまとめてダウンロードされます。" },
                                { q: "iPhoneの写真は使えますか？", a: "はい、HEIC形式の写真も自動的に変換して処理します。安心してお使いください。" },
                                { q: "設計チェックはどうやって使いますか？", a: "画面上部の「設計チェック」スイッチをONにしてから、通常通りファイルをドロップしてください。処理完了後にエメラルド色のレポートが表示されます。" }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                    <p className="font-black text-indigo-600 mb-2 flex items-center gap-2">
                                        <span className="text-xs bg-indigo-100 px-2 py-0.5 rounded-full">Q</span>
                                        {item.q}
                                    </p>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed pl-6 border-l-2 border-slate-200 ml-2">
                                        {item.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
                <div className="p-8 bg-slate-900 text-center">
                    <p className="text-[10px] text-slate-500 font-black tracking-[0.5em] uppercase italic">Ostrich Egg Hatchery Manual</p>
                </div>
            </motion.div>
        </div>
    );
};

const FeedbackModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (text: string) => void }) => {
    const [text, setText] = useState('');
    if (!isOpen) return null;

    const handleSend = () => {
        if (!text.trim()) return;
        onSubmit(text);
        setText('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] modal-overlay flex items-center justify-center p-6" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100" 
                onClick={e => e.stopPropagation()}
            >
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-amber-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shadow-sm">
                            <MessageSquare className="w-6 h-6 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">ご要望・改善案</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">ご要望は？</label>
                        <textarea 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="「ここをこうしてほしい」「こんな機能がほしい」など、お気軽に入力してください。"
                            className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 px-6 py-3.5 rounded-2xl font-black text-slate-400 hover:bg-slate-100 transition-all text-xs uppercase tracking-widest">
                            キャンセル
                        </button>
                        <button 
                            onClick={handleSend}
                            disabled={!text.trim()}
                            className="flex-[2] bg-amber-500 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-amber-600 disabled:bg-slate-200 transition-all text-xs uppercase tracking-widest shadow-lg shadow-amber-100"
                        >
                            送信する
                        </button>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold italic">メンバーの皆様の声でダチョウは進化します</p>
                </div>
            </motion.div>
        </div>
    );
};

const fetchRagDataFromGas = async (setStatusMessage?: (msg: string) => void, isCancelledRef?: React.MutableRefObject<boolean>, setIsFetchingRag?: (val: boolean) => void) => {
    const gasUrl = import.meta.env.VITE_GAS_URL;
    if (!gasUrl) {
        console.warn("VITE_GAS_URL is not set. Skipping RAG data fetch.");
        return null;
    }
    
    // タイムアウト設定（10秒に短縮）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        console.log("Fetching RAG data from GAS...");
        if (setStatusMessage) setStatusMessage("RAG知識データを取得しています...");
        if (setIsFetchingRag) setIsFetchingRag(true);
        
        if (isCancelledRef?.current) throw new Error("CANCELLED");

        const response = await fetch(gasUrl, { 
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);
        
        if (isCancelledRef?.current) throw new Error("CANCELLED");

        if (!response.ok) throw new Error(`GAS fetch failed: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        console.log("RAG data fetched successfully");
        if (setIsFetchingRag) setIsFetchingRag(false);
        return data;
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (setIsFetchingRag) setIsFetchingRag(false);
        if (err.message === "CANCELLED") {
            console.log("RAG fetch cancelled by user.");
            throw err;
        }
        if (err.name === 'AbortError') {
            console.error("GAS fetch timed out after 10 seconds.");
            if (setStatusMessage) setStatusMessage("RAGデータの取得がタイムアウトしました（10秒）。スキップします。");
        } else {
            console.error("Error fetching RAG data from GAS:", err);
            if (setStatusMessage) setStatusMessage(`RAGデータの取得に失敗しました: ${err.message}`);
        }
        // エラー時はnullを返して続行できるようにする
        return null;
    }
};

// --- Main App ---

export default function App() {
    const [mode, setMode] = useState(() => localStorage.getItem('ostrich_mode') || 'ocr');
    const [outFormat, setOutFormat] = useState('pdf');
    const [files, setFiles] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLayingEgg, setIsLayingEgg] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [showChangelog, setShowChangelog] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isFetchingRag, setIsFetchingRag] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);
    const isCancelledRef = useRef(false);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [ocrResult, setOcrResult] = useState('');
    const [designCheckResult, setDesignCheckResult] = useState('');
    const [ocrWidthMode, setOcrWidthMode] = useState<'original' | 'full' | 'half'>('original');
    const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
    const [ostrichEnabled, setOstrichEnabled] = useState(true);
    const [animationsEnabled, setAnimationsEnabled] = useState(true);
    const [isDesignCheckEnabled, setIsDesignCheckEnabled] = useState(() => {
        const saved = localStorage.getItem('ostrich_design_check');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isRagEnabled, setIsRagEnabled] = useState(() => {
        const saved = localStorage.getItem('ostrich_rag_enabled');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [isEditingResult, setIsEditingResult] = useState(false);
    const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('ostrich_selected_model') || 'gemini-3-flash-preview');
    const [designCheckCustomPrompt, setDesignCheckCustomPrompt] = useState("");
    const resultTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Persistence for settings
    useEffect(() => {
        localStorage.setItem('ostrich_mode', mode);
    }, [mode]);

    useEffect(() => {
        localStorage.setItem('ostrich_design_check', JSON.stringify(isDesignCheckEnabled));
    }, [isDesignCheckEnabled]);

    useEffect(() => {
        localStorage.setItem('ostrich_rag_enabled', JSON.stringify(isRagEnabled));
    }, [isRagEnabled]);


    useEffect(() => {
        localStorage.setItem('ostrich_selected_model', selectedModel);
    }, [selectedModel]);


    // Auto-resize textarea for design check result
    useEffect(() => {
        if (isEditingResult && resultTextareaRef.current) {
            resultTextareaRef.current.style.height = 'auto';
            resultTextareaRef.current.style.height = `${resultTextareaRef.current.scrollHeight}px`;
        }
    }, [designCheckResult, isEditingResult]);
    const [isTabFocused, setIsTabFocused] = useState(true);
    const originalTitle = useRef(document.title);
    const originalFavicon = useRef<string | null>(null);

    // Notification permission
    useEffect(() => {
        if (isDesignCheckEnabled && "Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, [isDesignCheckEnabled]);

    // Favicon helper
    const setFavicon = (emoji: string) => {
        const canvas = document.createElement('canvas');
        canvas.height = 32;
        canvas.width = 32;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.font = '28px serif';
            ctx.fillText(emoji, 0, 28);
            const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = canvas.toDataURL();
            document.getElementsByTagName('head')[0].appendChild(link);
        }
    };

    // Tab focus and reset logic
    useEffect(() => {
        if (isProcessing) {
            document.title = `(${progress}%) 処理中... PDFツール`;
        } else {
            document.title = originalTitle.current;
        }
    }, [isProcessing, progress]);

    useEffect(() => {
        const handleFocus = () => {
            setIsTabFocused(true);
            document.title = originalTitle.current;
            if (originalFavicon.current) {
                const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
                if (link) link.href = originalFavicon.current;
            }
        };
        const handleBlur = () => setIsTabFocused(false);

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        // Store original favicon
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (link) originalFavicon.current = link.href;

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    // Processing status notifications
    useEffect(() => {
        if (!isDesignCheckEnabled) return;

        if (isProcessing) {
            document.title = "処理中… PDFツール";
            setFavicon("⏳");
        }
    }, [isProcessing, isDesignCheckEnabled]);

    // Audio helper
    const playPikon = () => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); // E6

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    };

    const notifyCompletion = () => {
        if (!isDesignCheckEnabled) return;

        document.title = "完了 ● PDFツール";
        setFavicon("✅");
        playPikon();

        if (!isTabFocused && "Notification" in window && Notification.permission === "granted") {
            new Notification("解析完了", {
                body: "PDFの処理と設計チェックが完了しました。",
                icon: "/favicon.ico"
            });
        }
    };
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("リンクをコピーしました");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg = "リンクをコピーしました") => {
        setToastMessage(msg);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2000);
    };

    useEffect(() => {
        const savedFeedbacks = localStorage.getItem('ostrich_feedbacks');
        if (savedFeedbacks) setFeedbacks(JSON.parse(savedFeedbacks));
    }, []);

    const handleFeedbackSubmit = (text: string) => {
        const newFeedback = {
            id: Date.now(),
            text,
            time: new Date().toLocaleString(),
            status: 'new'
        };
        const updated = [newFeedback, ...feedbacks];
        setFeedbacks(updated);
        localStorage.setItem('ostrich_feedbacks', JSON.stringify(updated));
        
        // GAS環境（スプレッドシート）への送信
        const isGasEnv = typeof (window as any).google !== 'undefined' && (window as any).google.script && (window as any).google.script.run;
        
        if (isGasEnv) {
            try {
                (window as any).google.script.run
                    .withSuccessHandler(() => showToast("スプレッドシートに保存しました！"))
                    .withFailureHandler((err: any) => {
                        console.error("GAS Error:", err);
                        showToast("送信失敗: スプレッドシート側の権限を確認してください");
                    })
                    .saveFeedback(text);
            } catch (e) {
                showToast("GAS実行エラーが発生しました");
            }
        } else {
            showToast("送信完了（ブラウザに保存されました）");
        }
    };

    const downloadFeedbackCSV = () => {
        if (feedbacks.length === 0) return;
        const headers = ["ID", "Time", "Content"];
        const rows = feedbacks.map(f => [f.id, f.time, `"${f.text.replace(/"/g, '""')}"`]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        download(url, `ostrich_feedback_${Date.now()}.csv`);
    };

    const copyAppLink = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast();
    };

    const renderPdfPageToCanvas = async (pdf: any, pageNum: number, rotationOffset: number) => {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5, rotation: rotationOffset });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error("Canvas context not found");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext: any = { canvasContext: context, viewport: viewport };
        await page.render(renderContext).promise;
        return canvas;
    };

    const renderPdfToCanvas = async (file: File, pageNum: number, rotationOffset: number) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        return renderPdfPageToCanvas(pdf, pageNum, rotationOffset);
    };

    const triggerEggAnimation = () => {
        setIsLayingEgg(true);
        setTimeout(() => setIsLayingEgg(false), 3000);
    };

    const addHistoryItem = (name: string, url: string, count: number, action: string) => {
        setHistory(prev => [{ id: Date.now(), name, url, count, action, time: new Date().toLocaleString() }, ...prev]);
    };

    const rotateItem = (id: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f));
    };

    const handleOCRFiles = async (explicitUseRag?: boolean) => {
        const useRag = explicitUseRag !== undefined ? explicitUseRag : isRagEnabled;
        if (files.length === 0) return;
        setIsProcessing(true);
        setIsCancelled(false);
        isCancelledRef.current = false;
        setProgress(10);
        setStatusMessage(useRag ? "RAG解析を実行中..." : "図面チェックを実行中...");
        setOcrResult('');
        setDesignCheckResult('');
        setOcrWidthMode('original');
        
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("API_KEY_MISSING");
            const ai = new GoogleGenAI({ apiKey });

            let parts: any[] = [];
            let previewUrl = '';

            for (let fIdx = 0; fIdx < files.length; fIdx++) {
                const item = files[fIdx];
                const fileProgressStart = 10 + (fIdx / files.length) * 30;
                const fileProgressEnd = 10 + ((fIdx + 1) / files.length) * 30;

                if (isCancelledRef.current) throw new Error("CANCELLED");
                setProgress(fileProgressStart);

                const { canvas } = await getProcessedCanvas(item);
                const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
                if (!previewUrl) previewUrl = canvas.toDataURL('image/jpeg', 0.4);
                
                setProgress(fileProgressEnd);
            }
            
            setOcrPreviewUrl(previewUrl);
            
            if (isCancelledRef.current) throw new Error("CANCELLED");
            setProgress(40);

            // GASからプロンプトとRAGデータを取得
            const ragData = useRag ? await fetchRagDataFromGas(setStatusMessage, isCancelledRef, setIsFetchingRag) : null;

            let prompt = "この画像からテキストを抽出してください。表がある場合はMarkdown形式のテーブルとして出力してください。出力は日本語でお願いします。";
            
            if (useRag || isDesignCheckEnabled) {
                setStatusMessage("Gemini AIが解析中...");
                const jsonStructure = useRag ? `{
  "局番号": "",
  "局名": "",
  "図面Rev": "",
  "既設": {
    "周波数": "",
    "セクタ数": "",
    "アンテナ": "",
    "RU": ""
  },
  "新設": {
    "周波数": "",
    "セクタ数": "",
    "アンテナ": "",
    "RU": ""
  },
  "認証型式": "",
  "機器名称": "",
  "DU_MU": "",
  "伝送装置": "",
  "WDM": "",
  "RAN判定": "",
  "図面種類判定": "",
  "図面整合チェック": {
    "局番号一致": "",
    "局名一致": "",
    "図番連番": "",
    "欠番": "",
    "重複": "",
    "目次一致": "",
    "詳細": ""
  },
  "凡例ルールチェック": {
    "凡例": "",
    "新設＝赤": "",
    "撤去＝青": "",
    "詳細": ""
  },
  "図面内容チェック": "",
  "仮設工事チェック": "",
  "根拠": "",
  "不明点": "",
  "信頼度": ""
}` : `{
  "局番号": "",
  "局名": "",
  "図面Rev": "",
  "図面種類判定": "",
  "図面整合チェック": {
    "局番号一致": "",
    "局名一致": "",
    "図番連番": "",
    "欠番": "",
    "重複": "",
    "目次一致": "",
    "詳細": ""
  },
  "凡例ルールチェック": {
    "凡例": "",
    "新設＝赤": "",
    "撤去＝青": "",
    "詳細": ""
  },
  "図面内容チェック": "",
  "仮設工事チェック": "",
  "根拠": "",
  "不明点": "",
  "信頼度": ""
}`;

                const markdownFormat = useRag ? `
# 設計チェック結果

## 概要
- 局番号：
- 局名：
- 図面Rev：
- RAN：

---

## 既設設備
- 周波数：
- セクタ数：
- アンテナ：
- RU：

---

## 新設設備
- 周波数：
- セクタ数：
- アンテナ：
- RU：

---

## 構成
- DU/MU：
- 伝送装置：
- WDM：

---

## 機器
- 機器名称：

---

## チェック項目
### ① 図面種類判定
- 

### ② 図面整合チェック
- 局番号一致：
- 局名一致：
- 図番連番：
- 欠番：
- 重複：
- 目次一致：
- 詳細：

### ③ 凡例ルールチェック
- 凡例：
- 新設＝赤：
- 撤去＝青：
- 詳細：

### ④ 図面内容チェック
- 

### ⑤ 仮設工事チェック
- 

---

## 根拠
-

---

## 不明点
-

---

## 信頼度
-
---

## OCR抽出データ
- 
` : `
# 設計チェック結果

## 概要
- 局番号：
- 局名：
- 図面Rev：

---

## チェック項目
### ① 図面種類判定
- 

### ② 図面整合チェック
- 局番号一致：
- 局名一致：
- 図番連番：
- 欠番：
- 重複：
- 目次一致：
- 詳細：

### ③ 凡例ルールチェック
- 凡例：
- 新設＝赤：
- 撤去＝青：
- 詳細：

### ④ 図面内容チェック
- 

### ⑤ 仮設工事チェック
- 

---

## 根拠
-

---

## 不明点
-

---

## 信頼度
-
---

## OCR抽出データ
- 
`;

                const outputInstruction = `
【出力形式（厳守）】
出力は以下の2部構成とし、その間を「---」で区切ること：

① Markdown（最初に出力）
② OCR抽出データ（「## OCR抽出データ」という見出しの後に、画像から読み取れる全てのテキストを詳細に抽出してください。表がある場合はMarkdown形式のテーブルとして出力し、図面内の全ての文字情報を網羅してください。要約は禁止です。全データを抽出してください。）

Markdownは人間可読用とする。
自然文・説明文・前置き・後置きは禁止。

Markdownの形式（固定）：
${markdownFormat}
`;

                if (ragData && ragData.prompt) {
                    // GASから取得したプロンプトを使用
                    let knowledge = ragData.ragData || "データなし";
                    // 知識データが大きすぎる場合は切り詰める
                    if (knowledge.length > 30000) {
                        knowledge = knowledge.substring(0, 30000) + "...(データ過多のため省略)";
                    }

                    prompt = `【RAG解析結果】
以下は事前に取得された図面情報である。
この情報を優先参照すること。

${knowledge}

---

【解析指示】
上記のRAG解析結果および入力PDFを基に、以下のチェックを実行する。

① 図面種類判定
② 図面整合チェック（局番号・局名の一致、図番の連番・欠番・重複、目次との整合性）
③ 凡例ルールチェック（凡例の有無、新設＝赤・撤去＝青のルール遵守）
④ 図面内容チェック
⑤ 仮設工事チェック

${outputInstruction}

---

【制約】
・RAG情報を優先して判断すること
・RAG未記載事項のみPDFから補完すること
・推測禁止
・一部ページのみで判断禁止
・最初の検出で処理終了禁止
・キー名は変更禁止
・キーの欠落禁止（不明な場合は「不明」と記載）
・配列ではなく文字列で返す
・改行や装飾は禁止

${designCheckCustomPrompt ? `【追加指示】\n${designCheckCustomPrompt}\n` : ""}

【対象ファイル】
${files.length > 1 ? `${files[0].file.name} 他${files.length - 1}件` : files[0].file.name}`;
                } else {
                    // 標準の設計チェックプロンプト
                    prompt = `あなたは通信基地局の設計図面をチェックする専門家です。
画像から情報を読み取り、以下の項目についてチェックを行ってください。

【チェック項目】
① 図面種類判定：図面の種類（系統図、配置図、平面図など）を判定してください。
② 図面整合チェック：局番号・局名の一致、図番の連番・欠番・重複、目次との整合性を確認してください。
③ 凡例ルールチェック：凡例の有無、および「新設＝赤」「撤去＝青」のルールが守られているか確認してください。
④ 図面内容チェック：必要な設備情報が正しく記載されているか確認してください。
⑤ 仮設工事チェック：仮設工事に関する記述がある場合、その内容を確認してください。

${outputInstruction}

---

【制約】
・推測禁止
・一部ページのみで判断禁止
・最初の検出で処理終了禁止
・キー名は変更禁止
・キーの欠落禁止（不明な場合は「不明」と記載）
・配列ではなく文字列で返す
・改行や装飾は禁止
・画像から読み取れない項目は「不明」と記載してください。
・推測はせず、事実のみを抽出してください。
・出力は日本語でお願いします。

${designCheckCustomPrompt ? `【追加指示】\n${designCheckCustomPrompt}\n` : ""}

【対象ファイル】
${files.length > 1 ? `${files[0].file.name} 他${files.length - 1}件` : files[0].file.name}`;
                }
            }

            const response = await ai.models.generateContent({
                model: selectedModel,
                contents: {
                    parts: [
                        { text: prompt },
                        ...parts
                    ]
                },
                config: {
<<<<<<< HEAD
                    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
=======
                    thinkingConfig: { 
                        thinkingLevel: selectedModel.includes('pro') ? ThinkingLevel.HIGH : ThinkingLevel.LOW 
                    }
>>>>>>> ec41c49 (feat: 設計チェック、AI解析を個別に出力変更)
                }
            });
            
            if (isCancelledRef.current) throw new Error("CANCELLED");

            const text = response.text || "";
            
            // 解析結果の振り分け
            const ocrMarkers = ["## OCR抽出データ", "### OCR抽出データ", "OCR抽出データ:", "【OCR抽出データ】"];
            let foundMarker = "";
            for (const marker of ocrMarkers) {
                if (text.includes(marker)) {
                    foundMarker = marker;
                    break;
                }
            }

            if (foundMarker) {
                const parts = text.split(foundMarker);
                const mainResult = parts[0].trim();
                const ocrPart = parts[1].trim();
                
                setDesignCheckResult(mainResult);
                setOcrResult(ocrPart);
                triggerEggAnimation();
                setTimeout(() => {
                    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                if (useRag || isDesignCheckEnabled) {
                    setDesignCheckResult(text);
                    triggerEggAnimation();
                    setTimeout(() => {
                        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                } else {
                    setOcrResult(text);
                    setDesignCheckResult("");
                }
            }

            addHistoryItem(`${useRag ? 'AIRAG解析' : isDesignCheckEnabled ? '設計チェック' : 'OCR抽出'}: ${files.length > 1 ? `${files[0].file.name} 他${files.length - 1}件` : files[0].file.name}`, "#", files.length, 'OCR');
            showToast("処理が完了しました");
            setProgress(100);
        } catch (err: any) {
            if (err.message === "CANCELLED") {
                showToast("キャンセルされました");
            } else {
                console.error("OCR Error:", err);
                const errorMsg = err.message === "API_KEY_MISSING" 
                    ? "APIキーが設定されていません。" 
                    : "エラーが発生しました。ファイル形式を確認してください。";
                showToast(errorMsg);
            }
        } finally {
            setIsProcessing(false);
            setIsCancelled(false);
            isCancelledRef.current = false;
            setProgress(0);
            setStatusMessage("");
        }
    };

    const addFiles = React.useCallback(async (newFiles: FileList | File[] | null) => {
        console.log("addFiles execution started", { count: newFiles?.length, mode });
        if (!newFiles || newFiles.length === 0) return;

        const accepted = mode === 'join' ? /\.(svg|pdf|heic|heif|jpg|jpeg|png)$/i : (mode === 'ocr' ? /\.(jpg|jpeg|png|heic|heif|pdf|svg)$/i : /\.pdf$/i);
        const filtered = Array.from(newFiles).filter(f => f.name.match(accepted));
        console.log("Filtered files", filtered.map(f => f.name));
        
        if (filtered.length === 0) {
            console.warn("No accepted files found for mode:", mode);
            alert(`選択されたファイルは現在のモード（${mode}）では使用できない形式です。`);
            return;
        }

        if (mode === 'ocr') {
            // OCRモードでもファイルをリストに追加し、ボタンで実行するように変更
            setIsProcessing(true);
            setIsCancelled(false);
            isCancelledRef.current = false;
            setProgress(0);
            
            const allMapped: any[] = [];
            try {
                for (let i = 0; i < filtered.length; i++) {
                    if (isCancelledRef.current) throw new Error("CANCELLED");
                    const file = filtered[i];
                    const lowerName = file.name.toLowerCase();
                    
                    if (lowerName.endsWith('.pdf')) {
                        const arrayBuffer = await file.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
                        for (let p = 1; p <= pdf.numPages; p++) {
                            const id = Math.random().toString(36).substr(2, 9);
                            const canvas = await renderPdfPageToCanvas(pdf, p, 0);
                            const preview = canvas.toDataURL('image/jpeg', 0.4);
                            allMapped.push({ id, file, preview, type: 'pdf', rotation: 0, pageNum: p, totalPage: pdf.numPages, originalName: file.name });
                        }
                    } else if (lowerName.endsWith('.svg')) {
                        const id = Math.random().toString(36).substr(2, 9);
                        const { canvas } = await getProcessedCanvas({ file, type: 'svg', rotation: 0 });
                        const preview = canvas.toDataURL('image/jpeg', 0.4);
                        allMapped.push({ id, file, preview, type: 'svg', rotation: 0 });
                    } else {
                        const id = Math.random().toString(36).substr(2, 9);
                        let preview = "";
                        if (lowerName.match(/\.(heic|heif)$/i)) {
                            const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
                            const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                            preview = URL.createObjectURL(blobToUse);
                        } else {
                            preview = URL.createObjectURL(file);
                        }
                        allMapped.push({ id, file, preview, type: 'image', rotation: 0 });
                    }
                    setProgress(Math.round(((i + 1) / filtered.length) * 100));
                }
                setFiles(prev => [...prev, ...allMapped]);
                showToast(`${filtered.length}個のファイルを追加しました`);
            } catch (err: any) {
                if (err.message !== "CANCELLED") {
                    console.error("Error adding files:", err);
                    alert("ファイルの読み込み中にエラーが発生しました。");
                }
            } finally {
                setIsProcessing(false);
                setProgress(0);
            }
            return;
        }

        setIsProcessing(true);
        setIsCancelled(false);
        isCancelledRef.current = false;
        setProgress(0);
        
        const allMapped: any[] = [];
        try {
            for (let i = 0; i < filtered.length; i++) {
                if (isCancelledRef.current) throw new Error("CANCELLED");
                const file = filtered[i];
                const lowerName = file.name.toLowerCase();
                console.log(`Processing file ${i+1}/${filtered.length}: ${file.name}`);
                
                if (lowerName.endsWith('.pdf') && mode === 'join') {
                    console.log("Loading PDF for joining...");
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
                    console.log(`PDF loaded successfully: ${pdf.numPages} pages`);
                    
                    for (let p = 1; p <= pdf.numPages; p++) {
                        if (isCancelledRef.current) throw new Error("CANCELLED");
                        const id = Math.random().toString(36).substr(2, 9);
                        const canvas = await renderPdfPageToCanvas(pdf, p, 0);
                        const preview = canvas.toDataURL('image/jpeg', 0.4);
                        allMapped.push({ 
                            id, 
                            file, 
                            preview, 
                            type: 'pdf', 
                            rotation: 0, 
                            pageNum: p, 
                            totalPage: pdf.numPages,
                            originalName: file.name
                        });
                        setProgress(Math.round(((i + (p / pdf.numPages)) / filtered.length) * 100));
                    }
                } else {
                    const id = Math.random().toString(36).substr(2, 9);
                    let processedFile = file;
                    let preview: string | null = null;
                    let type = 'unknown';

                    if (lowerName.endsWith('.svg')) {
                        type = 'svg';
                        preview = URL.createObjectURL(file);
                    } else if (lowerName.endsWith('.pdf')) {
                        type = 'pdf';
                        try {
                            console.log("Generating PDF preview...");
                            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
                            const canvas = await renderPdfPageToCanvas(pdf, 1, 0);
                            preview = canvas.toDataURL('image/jpeg', 0.4);
                            console.log("PDF preview generated");
                        } catch (err) {
                            console.error("PDF preview generation error:", err);
                        }
                    } else if (lowerName.match(/\.(jpg|jpeg|png)$/i)) {
                        type = 'image';
                        preview = URL.createObjectURL(file);
                    } else if (lowerName.match(/\.(heic|heif)$/i)) {
                        type = 'heic';
                        try {
                            const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
                            const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                            preview = URL.createObjectURL(blobToUse);
                            processedFile = new File([blobToUse], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
                        } catch (err) {
                            console.error("HEIC conversion error:", err);
                        }
                    }
                    allMapped.push({ id, file: processedFile, preview, type, rotation: 0, originalName: file.name });
                }
                setProgress(Math.round(((i + 1) / filtered.length) * 100));
            }

            console.log("Successfully mapped files:", allMapped.length);
            if (mode === 'split') {
                setFiles(allMapped);
            } else {
                setFiles(prev => [...prev, ...allMapped]);
            }
        } catch (err: any) {
            if (err.message === "CANCELLED") {
                showToast("処理を強制停止しました");
            } else {
                console.error("Critical error in addFiles:", err);
                alert("ファイルの処理中にエラーが発生しました。詳細はコンソールを確認してください。");
            }
        } finally {
            setIsProcessing(false);
            setIsCancelled(false);
            isCancelledRef.current = false;
            setProgress(0);
        }
    }, [mode, handleOCRFiles, showToast]);

    const getProcessedCanvas = async (item: any): Promise<{ canvas: HTMLCanvasElement, canvasWidth: number, canvasHeight: number }> => {
        if (item.type === 'pdf') {
            const canvas = await renderPdfToCanvas(item.file, item.pageNum || 1, item.rotation);
            return { canvas, canvasWidth: canvas.width, canvasHeight: canvas.height };
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error("Canvas context not found"));
                    let width = img.width || 800;
                    let height = img.height || 600;
                    
                    // SVGの場合は解像度を上げるためにスケールを大きくする
                    const isSvg = item.type === 'svg' || (item.file && item.file.name.toLowerCase().endsWith('.svg'));
                    const scaleFactor = isSvg ? 4 : 2;

                    const isVertical = item.rotation === 90 || item.rotation === 270;
                    const canvasWidth = isVertical ? height : width;
                    const canvasHeight = isVertical ? width : height;

                    canvas.width = canvasWidth * scaleFactor;
                    canvas.height = canvasHeight * scaleFactor;
                    ctx.scale(scaleFactor, scaleFactor);
                    ctx.translate(canvasWidth / 2, canvasHeight / 2);
                    ctx.rotate((item.rotation * Math.PI) / 180);
                    ctx.translate(-width / 2, -height / 2);
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve({ canvas, canvasWidth, canvasHeight });
                };
                img.onerror = () => reject(new Error("イメージの読み込みに失敗しました"));
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(item.file);
        });
    };

    const performDesignCheck = async (useRag: boolean = false) => {
        if (files.length === 0) return;
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return;
            const ai = new GoogleGenAI({ apiKey });
            
            setStatusMessage(useRag ? "RAG知識データを取得しています..." : "図面チェックを実行中...");

            // GASからプロンプトとRAGデータを取得
            const ragData = useRag ? await fetchRagDataFromGas(setStatusMessage, isCancelledRef, setIsFetchingRag) : null;
            
            setStatusMessage("図面を解析用に変換しています...");
            const parts: any[] = [];
            const maxPages = 10; // 結合/分割時は代表して10ページまで
            let pageCount = 0;

            for (let fIdx = 0; fIdx < files.length && pageCount < maxPages; fIdx++) {
                if (isCancelledRef.current) throw new Error("CANCELLED");
                const item = files[fIdx];
                const { canvas } = await getProcessedCanvas(item);
                const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
                pageCount++;
            }

            let prompt = "";
            const fileName = files.length > 1 ? `${files[0].file.name} 他${files.length - 1}件` : files[0].file.name;
            const jsonStructure = useRag ? `{
  "局番号": "",
  "局名": "",
  "図面Rev": "",
  "既設": {
    "周波数": "",
    "セクタ数": "",
    "アンテナ": "",
    "RU": ""
  },
  "新設": {
    "周波数": "",
    "セクタ数": "",
    "アンテナ": "",
    "RU": ""
  },
  "認証型式": "",
  "機器名称": "",
  "DU_MU": "",
  "伝送装置": "",
  "WDM": "",
  "RAN判定": "",
  "図面種類判定": "",
  "図面整合チェック": {
    "局番号一致": "",
    "局名一致": "",
    "図番連番": "",
    "欠番": "",
    "重複": "",
    "目次一致": "",
    "詳細": ""
  },
  "凡例ルールチェック": {
    "凡例": "",
    "新設＝赤": "",
    "撤去＝青": "",
    "詳細": ""
  },
  "図面内容チェック": "",
  "仮設工事チェック": "",
  "根拠": "",
  "不明点": "",
  "信頼度": ""
}` : `{
  "局番号": "",
  "局名": "",
  "図面Rev": "",
  "図面種類判定": "",
  "図面整合チェック": {
    "局番号一致": "",
    "局名一致": "",
    "図番連番": "",
    "欠番": "",
    "重複": "",
    "目次一致": "",
    "詳細": ""
  },
  "凡例ルールチェック": {
    "凡例": "",
    "新設＝赤": "",
    "撤去＝青": "",
    "詳細": ""
  },
  "図面内容チェック": "",
  "仮設工事チェック": "",
  "根拠": "",
  "不明点": "",
  "信頼度": ""
}`;

            const markdownFormat = useRag ? `
# 設計チェック結果

## 概要
- 局番号：
- 局名：
- 図面Rev：
- RAN：

---

## 既設設備
- 周波数：
- セクタ数：
- アンテナ：
- RU：

---

## 新設設備
- 周波数：
- セクタ数：
- アンテナ：
- RU：

---

## 構成
- DU/MU：
- 伝送装置：
- WDM：

---

## 機器
- 機器名称：

---

## チェック項目
### ① 図面種類判定
- 

### ② 図面整合チェック
- 局番号一致：
- 局名一致：
- 図番連番：
- 欠番：
- 重複：
- 目次一致：
- 詳細：

### ③ 凡例ルールチェック
- 凡例：
- 新設＝赤：
- 撤去＝青：
- 詳細：

### ④ 図面内容チェック
- 

### ⑤ 仮設工事チェック
- 

---

## 根拠
-

---

## 不明点
-

---

## 信頼度
-
---

## OCR抽出データ
- 
` : `
# 設計チェック結果

## 概要
- 局番号：
- 局名：
- 図面Rev：

---

## チェック項目
### ① 図面種類判定
- 

### ② 図面整合チェック
- 局番号一致：
- 局名一致：
- 図番連番：
- 欠番：
- 重複：
- 目次一致：
- 詳細：

### ③ 凡例ルールチェック
- 凡例：
- 新設＝赤：
- 撤去＝青：
- 詳細：

### ④ 図面内容チェック
- 

### ⑤ 仮設工事チェック
- 

---

## 根拠
-

---

## 不明点
-

---

## 信頼度
-
---

## OCR抽出データ
- 
`;

            const outputInstruction = `
【出力形式（厳守）】
出力は以下の2部構成とし、その間を「---」で区切ること：

① Markdown（最初に出力）
② OCR抽出データ（「## OCR抽出データ」という見出しの後に、画像から読み取れる全てのテキストを詳細に抽出してください。表がある場合はMarkdown形式のテーブルとして出力し、図面内の全ての文字情報を網羅してください。要約は禁止です。全データを抽出してください。）

Markdownは人間可読用とする。
自然文・説明文・前置き・後置きは禁止。

Markdownの形式（固定）：
${markdownFormat}
`;

            if (useRag || isDesignCheckEnabled) {
                if (ragData && ragData.prompt) {
                    // GASから取得したプロンプトを使用
                    let knowledge = ragData.ragData || "データなし";
                    // 知識データが大きすぎる場合は切り詰める
                    if (knowledge.length > 30000) {
                        knowledge = knowledge.substring(0, 30000) + "...(データ過多のため省略)";
                    }

                    prompt = `【RAG解析結果】
以下は事前に取得された図面情報である。
この情報を優先参照すること。

${knowledge}

---

【解析指示】
上記のRAG解析結果および入力PDFを基に、以下のチェックを実行する。

① 図面種類判定
② 図面整合チェック（局番号・局名の一致、図番の連番・欠番・重複、目次との整合性）
③ 凡例ルールチェック（凡例の有無、新設＝赤・撤去＝青のルール遵守）
④ 図面内容チェック
⑤ 仮設工事チェック

${outputInstruction}

---

【制約】
・RAG情報を優先して判断すること
・RAG未記載事項のみPDFから補完すること
・推測禁止
・一部ページのみで判断禁止
・最初の検出で処理終了禁止
・キー名は変更禁止
・キーの欠落禁止（不明な場合は「不明」と記載）
・配列ではなく文字列で返す
・改行や装飾は禁止

${designCheckCustomPrompt ? `【追加指示】\n${designCheckCustomPrompt}\n` : ""}

【対象ファイル】
${fileName}`;
                } else {
                    // 標準の設計チェックプロンプト
                    prompt = `あなたは通信基地局の設計図面をチェックする専門家です。
画像から情報を読み取り、以下の項目についてチェックを行ってください。

【チェック項目】
① 図面種類判定：図面の種類（系統図、配置図、平面図など）を判定してください。
② 図面整合チェック：局番号・局名の一致、図番の連番・欠番・重複、目次との整合性を確認してください。
③ 凡例ルールチェック：凡例の有無、および「新設＝赤」「撤去＝青」のルールが守られているか確認してください。
④ 図面内容チェック：必要な設備情報が正しく記載されているか確認してください。
⑤ 仮設工事チェック：仮設工事に関する記述がある場合、その内容を確認してください。

${outputInstruction}

---

【制約】
・推測禁止
・一部ページのみで判断禁止
・最初の検出で処理終了禁止
・キー名は変更禁止
・キーの欠落禁止（不明な場合は「不明」と記載）
・配列ではなく文字列で返す
・改行や装飾は禁止
・画像から読み取れない項目は「不明」と記載してください。
・推測はせず、事実のみを抽出してください。
・出力は日本語でお願いします。

${designCheckCustomPrompt ? `【追加指示】\n${designCheckCustomPrompt}\n` : ""}

【対象ファイル】
${fileName}`;
                }
            }

            setStatusMessage("Gemini AIが解析中...");
            const response = await ai.models.generateContent({
<<<<<<< HEAD
                model: "gemini-3-flash-preview",
                contents: { parts: [{ text: prompt }, ...parts] },
                config: {
                    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
=======
                model: selectedModel,
                contents: { parts: [{ text: prompt }, ...parts] },
                config: {
                    thinkingConfig: { 
                        thinkingLevel: selectedModel.includes('pro') ? ThinkingLevel.HIGH : ThinkingLevel.LOW 
                    }
>>>>>>> ec41c49 (feat: 設計チェック、AI解析を個別に出力変更)
                }
            });

            if (isCancelledRef.current) throw new Error("CANCELLED");

            setProgress(100);
            setStatusMessage("解析完了");
            const text = response.text || "";
            
            // 解析結果の振り分け
            const ocrMarkers = ["## OCR抽出データ", "### OCR抽出データ", "OCR抽出データ:", "【OCR抽出データ】"];
            let foundMarker = "";
            for (const marker of ocrMarkers) {
                if (text.includes(marker)) {
                    foundMarker = marker;
                    break;
                }
            }

            if (foundMarker) {
                const parts = text.split(foundMarker);
                const mainResult = parts[0].trim();
                const ocrPart = parts[1].trim();
                
                setDesignCheckResult(mainResult);
                setOcrResult(ocrPart);
                setTimeout(() => {
                    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                if (useRag || isDesignCheckEnabled) {
                    setDesignCheckResult(text);
                    setTimeout(() => {
                        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                } else {
                    setOcrResult(text);
                    setDesignCheckResult("");
                }
            }
        } catch (err: any) {
            console.error("Design Check Error:", err);
            setStatusMessage("エラーが発生しました");
            if (err.message === "CANCELLED") throw err;
        }
    };

    const handleJoinProcess = async (explicitUseRag?: boolean) => {
        const useRag = explicitUseRag !== undefined ? explicitUseRag : isRagEnabled;
        console.log("handleJoinProcess started", { filesCount: files.length, outFormat, useRag });
        if (isProcessing || files.length === 0) {
            console.warn("No files to process or already processing");
            return;
        }
        setIsProcessing(true);
        setOcrResult('');
        setDesignCheckResult('');
        setIsCancelled(false);
        isCancelledRef.current = false;
        setProgress(0);
        setStatusMessage(useRag ? "RAG解析を実行中..." : "図面を結合しています...");
        const timestamp = Date.now();
        try {
            // 設計チェックが有効な場合、またはRAG解析が指定された場合
            if (isDesignCheckEnabled || useRag) {
                await performDesignCheck(useRag);
            }

            if (outFormat === 'pdf') {
                const mergedPdf = await PDFDocument.create();
                for (let i = 0; i < files.length; i++) {
                    if (isCancelledRef.current) throw new Error("CANCELLED");
                    const item = files[i];
                    console.log(`Processing item ${i}:`, item.type, item.file?.name);
                    if (item.type === 'svg' || item.type === 'heic' || item.type === 'image' || (item.file && item.file.type.startsWith('image/'))) {
                        const { canvas, canvasWidth, canvasHeight } = await getProcessedCanvas(item);
                        const imgData = canvas.toDataURL('image/jpeg', 0.9);
                        const singlePdf = new jsPDF({
                            orientation: canvasWidth > canvasHeight ? 'l' : 'p',
                            unit: 'pt',
                            format: [canvasWidth, canvasHeight]
                        });
                        singlePdf.addImage(imgData, 'JPEG', 0, 0, canvasWidth, canvasHeight);
                        const donor = await PDFDocument.load(new Uint8Array(singlePdf.output('arraybuffer')));
                        const pages = await mergedPdf.copyPages(donor, donor.getPageIndices());
                        pages.forEach(p => mergedPdf.addPage(p));
                    } else if (item.type === 'pdf') {
                        const donor = await PDFDocument.load(new Uint8Array(await item.file.arrayBuffer()));
                        const pageIndex = item.pageNum ? [item.pageNum - 1] : donor.getPageIndices();
                        const pages = await mergedPdf.copyPages(donor, pageIndex);
                        pages.forEach(page => {
                            if (item.rotation !== 0) {
                                page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360));
                            }
                            mergedPdf.addPage(page);
                        });
                    } else {
                        console.warn(`Unknown item type at index ${i}:`, item.type);
                    }
                    setProgress(Math.round(((i + 1) / files.length) * 100));
                    await new Promise(r => setTimeout(r, 100)); 
                }
                const pdfBytes = await mergedPdf.save();
                const fileName = `ダチョウの卵_${timestamp}.pdf`;
                const url = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
                addHistoryItem(fileName, url, files.length, 'JOIN');
                download(url, fileName);
                
                console.log("PDF merge successful");
            } else {
                let totalSteps = 0;
                for (const item of files) {
                    if (item.type === 'pdf' && item.file) {
                        const pdf = await pdfjsLib.getDocument(await item.file.arrayBuffer()).promise;
                        totalSteps += pdf.numPages;
                    } else {
                        totalSteps += 1;
                    }
                }

                const zip = new JSZip();
                let currentStep = 0;
                for (let i = 0; i < files.length; i++) {
                    if (isCancelledRef.current) throw new Error("CANCELLED");
                    const item = files[i];
                    const mime = outFormat === 'png' ? 'image/png' : 'image/jpeg';
                    const ext = outFormat;

                    if (item.type === 'pdf') {
                        const pdf = await pdfjsLib.getDocument(await item.file.arrayBuffer()).promise;
                        for (let p = 1; p <= pdf.numPages; p++) {
                            if (isCancelledRef.current) throw new Error("CANCELLED");
                            const canvas = await renderPdfToCanvas(item.file, p, item.rotation);
                            const fileName = `ダチョウの卵_${item.file.name.split('.')[0]}_p${p}.${ext}`;
                            const dataUrl = canvas.toDataURL(mime, 0.95);
                            const base64Data = dataUrl.split(',')[1];
                            zip.file(fileName, base64Data, { base64: true });
                            currentStep++;
                            setProgress(Math.round((currentStep / totalSteps) * 100));
                            await new Promise(r => setTimeout(r, 100));
                        }
                    } else {
                        const { canvas } = await getProcessedCanvas(item);
                        const fileName = `ダチョウの卵_${item.file.name.split('.')[0]}.${ext}`;
                        const dataUrl = canvas.toDataURL(mime, 0.95);
                        const base64Data = dataUrl.split(',')[1];
                        zip.file(fileName, base64Data, { base64: true });
                        currentStep++;
                        setProgress(Math.round((currentStep / totalSteps) * 100));
                        await new Promise(r => setTimeout(r, 100));
                    }
                }
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const zipUrl = URL.createObjectURL(zipBlob);
                const zipName = `ダチョウの卵_変換一括_${timestamp}.zip`;
                download(zipUrl, zipName);
                addHistoryItem(zipName, zipUrl, totalSteps, 'CONVERT');
            }
            setFiles([]);
            triggerEggAnimation();
            showToast("処理が完了しました");
            if (isDesignCheckEnabled) notifyCompletion();
        } catch (e: any) {
            if (e.message === "CANCELLED") {
                showToast("処理を強制停止しました");
            } else {
                console.error("Join Process Error:", e);
                alert("エラーが発生しました: " + e.message);
            }
        } finally {
            setIsProcessing(false);
            setIsCancelled(false);
            isCancelledRef.current = false;
            setStatusMessage("");
            setProgress(0);
        }
    };

    const processSplit = async () => {
        if (isProcessing || files.length === 0) return;
        setIsProcessing(true);
        setIsCancelled(false);
        isCancelledRef.current = false;
        setProgress(0);
        setStatusMessage("PDFを分割しています...");
        const timestamp = Date.now();
        try {
            if (isDesignCheckEnabled || isRagEnabled) {
                await performDesignCheck(isRagEnabled);
            }
            const file = files[0].file;
            const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
            const pageCount = pdfDoc.getPageCount();
            const zip = new JSZip();
            for (let i = 0; i < pageCount; i++) {
                if (isCancelledRef.current) throw new Error("CANCELLED");
                const newPdf = await PDFDocument.create();
                const [page] = await newPdf.copyPages(pdfDoc, [i]);
                newPdf.addPage(page);
                const pdfBytes = await newPdf.save();
                const fileName = `分割_${i+1}.pdf`;
                zip.file(fileName, pdfBytes);
                setProgress(Math.round(((i + 1) / pageCount) * 100));
                await new Promise(r => setTimeout(r, 50));
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);
            const zipName = `ダチョウの卵_分割_${file.name.split('.')[0]}_${timestamp}.zip`;
            download(zipUrl, zipName);
            addHistoryItem(zipName, zipUrl, pageCount, 'SPLIT');

            setFiles([]);
            triggerEggAnimation();
            if (isDesignCheckEnabled) notifyCompletion();
        } catch (e: any) { 
            if (e.message === "CANCELLED") {
                showToast("処理を強制停止しました");
            } else {
                alert(e.message); 
            }
        } finally {
            setIsProcessing(false);
            setIsCancelled(false);
            isCancelledRef.current = false;
            setStatusMessage("");
            setProgress(0);
        }
    };

    const download = (url: string, name: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);
    };

    const resultRef = useRef<HTMLDivElement>(null);
    const ocrResultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if ((ocrResult || designCheckResult) && !isProcessing) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [ocrResult, designCheckResult, isProcessing]);

    const getProcessedOcrText = () => {
        if (ocrWidthMode === 'full') {
            return ocrResult.replace(/[!-~]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0)).replace(/ /g, "\u3000");
        }
        if (ocrWidthMode === 'half') {
            return ocrResult.replace(/[\uff01-\uff5e]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/\u3000/g, " ");
        }
        return ocrResult;
    };

    const processedOcrText = getProcessedOcrText();

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 relative">
            <AnimatePresence>
                {toastVisible && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="toast show"
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {isProcessing && (
                <div className="fixed top-0 left-0 w-full z-[200] pointer-events-none">
                    <div className="bg-indigo-100 h-3 w-full overflow-hidden shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.6)] relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </motion.div>
                    </div>
                    {statusMessage && (
                        <div className="flex justify-center mt-2">
                            <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg border border-slate-200 flex items-center gap-2 animate-bounce-subtle">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{statusMessage} ({progress}%)</span>
                                {isFetchingRag && (
                                    <button 
                                        onClick={() => {
                                            isCancelledRef.current = true;
                                            setIsCancelled(true);
                                        }}
                                        className="ml-2 px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-md text-[8px] font-black uppercase tracking-wider border border-rose-200 transition-colors pointer-events-auto"
                                    >
                                        Skip
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isProcessing && (
                <div className="fixed bottom-10 right-10 z-[120] flex flex-col items-center gap-4">
                    <div className={`bg-[#0a0a0a] p-1 rounded-xl border-2 border-[#222] shadow-[0_0_40px_-12px_rgba(255,0,0,0.4)] flex flex-col items-center overflow-hidden ring-1 ring-[#333] ${!animationsEnabled ? 'no-animation' : ''}`}>
                        {/* Top Banner - Smaller */}
                        <div className="w-full bg-[#ffcc00] text-black text-[7px] font-black py-1 px-4 flex justify-between items-center border-b-2 border-black">
                            <span className="animate-pulse">!</span>
                            <span className="tracking-[0.2em] font-black uppercase">Operation Cancel</span>
                            <span className="animate-pulse">!</span>
                        </div>
                        
                        <div className="p-4 flex flex-col items-center gap-4 bg-[#111] bg-[radial-gradient(circle_at_center,rgba(153,0,0,0.05)_0%,transparent_70%)]">
                            {/* Hexagonal Button Container - Smaller */}
                            <div className="relative group">
                                {/* Outer Frame Glow */}
                                <div className="absolute -inset-2 bg-rose-600/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <button 
                                    onClick={() => {
                                        if (isCancelled) return;
                                        isCancelledRef.current = true;
                                        setIsCancelled(true);
                                        // UIを即座にリセット
                                        setIsProcessing(false);
                                        setProgress(0);
                                        setStatusMessage("");
                                        showToast("停止リクエストを受け付けました");
                                    }}
                                    disabled={isCancelled}
                                    className={`w-28 h-24 bg-[#330000] relative flex items-center justify-center transition-all active:scale-95 active:translate-y-1 shadow-[0_6px_0_0_#1a0000] hover:shadow-[0_3px_0_0_#1a0000] hover:translate-y-0.5 ${isCancelled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                    style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                                >
                                    <div className={`absolute inset-1.5 ${isCancelled ? 'bg-[#444]' : 'bg-[#770000] animate-pulse-red'} flex flex-col items-center justify-center border border-rose-400/20`} style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}>
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_60%)]"></div>
                                        
                                        {/* Ostrich Face Schematic - Smaller */}
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
                                            <svg width="40" height="40" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="60" cy="60" r="55" fill="none" stroke="#fff" strokeWidth="0.5" strokeDasharray="4 4" />
                                                <g transform="translate(10, 20) scale(0.8)">
                                                    <path d="M40 100 C50 60, 45 20, 65 25" strokeWidth="8" fill="none" stroke="#fff" strokeLinecap="round" />
                                                    <circle cx="65" cy="25" r="10" fill="none" stroke="#fff" strokeWidth="2" />
                                                    <path d="M72 25 L95 28 L72 32 Z" fill="none" stroke="#fff" strokeWidth="2" />
                                                </g>
                                            </svg>
                                        </div>

                                        <span className="text-white text-2xl font-black tracking-tighter mb-0.5 select-none drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] z-10" style={{ fontFamily: '"Sawarabi Gothic", sans-serif' }}>
                                            {isCancelled ? '停止中' : '停止'}
                                        </span>
                                        <span className="text-white/30 text-[7px] font-black tracking-[0.3em] select-none uppercase z-10">Unit-01</span>
                                    </div>
                                    {/* Glass Shine */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none"></div>
                                </button>
                            </div>

                            {/* Bottom Industrial Label - Smaller */}
                            <div className="bg-[#000] border border-[#222] p-2 rounded-lg w-full shadow-inner">
                                <div className="flex justify-between items-center mb-1 px-1">
                                    <div className="w-1 h-1 rounded-full bg-rose-600/50"></div>
                                    <div className="text-[#555] text-[7px] font-black uppercase tracking-tighter">Safety Override System</div>
                                    <div className="w-1 h-1 rounded-full bg-rose-600/50"></div>
                                </div>
                                <div className="text-[#444] text-[7px] font-black leading-tight uppercase tracking-widest text-center border-t border-[#111] pt-1">
                                    Emergency / Manual Reset
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <Ostrich isActive={isProcessing} isLaying={isLayingEgg} isSearching={isDraggingOver} enabled={ostrichEnabled} animationsEnabled={animationsEnabled} />
            <OstrichEggButton onClick={() => setShowManual(true)} />
            <ManualModal isOpen={showManual} onClose={() => setShowManual(false)} />
            <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} onSubmit={handleFeedbackSubmit} />

            <header className="text-center mb-12">
                <div className="flex flex-col items-center gap-4 mb-10">
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">AI Model</span>
                            <select 
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="text-[11px] font-black text-indigo-600 bg-transparent outline-none cursor-pointer"
                            >
                                <option value="gemini-3-flash-preview">Gemini 3 Flash (高速)</option>
                                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (高精度)</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ostrich</span>
                            <button 
                                onClick={() => setOstrichEnabled(!ostrichEnabled)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${ostrichEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${ostrichEnabled ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Anime</span>
                            <button 
                                onClick={() => setAnimationsEnabled(!animationsEnabled)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${animationsEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${animationsEnabled ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">AI RAG解析</span>
                            <button 
                                onClick={() => setIsRagEnabled(!isRagEnabled)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${isRagEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isRagEnabled ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">設計チェック</span>
                            <button 
                                onClick={() => setIsDesignCheckEnabled(!isDesignCheckEnabled)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${isDesignCheckEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDesignCheckEnabled ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                            <span className="text-indigo-700 text-[11px] font-black uppercase tracking-[0.2em]">BETA PHASE</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setShowFeedback(true)} className="bg-white hover:bg-slate-50 text-amber-600 border border-amber-100 p-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 text-xs font-bold">
                                <MessageSquare className="w-4 h-4" /> 要望
                            </button>
                            <button onClick={() => setShowGuide(!showGuide)} className="bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 p-2.5 rounded-xl shadow-sm">
                                <HelpCircle className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Primary Action Button moved to header */}
                        <div className="ml-4">
                            <button 
                                onClick={() => {
                                    if (mode === 'ocr') handleOCRFiles();
                                    else if (mode === 'join') handleJoinProcess();
                                    else if (mode === 'split') processSplit();
                                }}
                                disabled={isProcessing || files.length === 0}
                                className={`px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${
                                    isProcessing 
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                                    : files.length === 0 
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-200'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        {progress}% 処理中
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3.5 h-3.5" />
                                        {mode === 'ocr' ? "解析実行" : mode === 'join' ? "生成開始" : "分割実行"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {showGuide && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="guide-bubble max-w-sm p-4 rounded-2xl shadow-lg text-left"
                        >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b pb-1">Tester's Guide</p>
                            <ul className="text-xs text-slate-600 space-y-2 font-bold">
                                <li>・SVG, PDF, HEIC, JPEG, PNG に対応</li>
                                <li>・複数の画像を1つのPDFに結合できます</li>
                                <li>・ドラッグして並び順を変更可能</li>
                                <li>・OCRモードで画像から文字起こしが可能</li>
                            </ul>
                        </motion.div>
                    )}
                </div>

                <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter">SVG & PDF <span className="text-indigo-600">Pro</span></h1>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Multi-Format Egg Hatchery</p>
                
                <div className="flex justify-center mt-12 space-x-12 border-b border-slate-200">
                    <button onClick={() => { setMode('join'); setFiles([]); setOcrPreviewUrl(null); }} className={`pb-5 px-6 text-sm font-black flex items-center gap-2.5 transition-all ${mode === 'join' ? 'tab-active' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Plus className="w-5 h-5" /> 結合・変換
                    </button>
                    <button onClick={() => { setMode('split'); setFiles([]); setOcrPreviewUrl(null); }} className={`pb-5 px-6 text-sm font-black flex items-center gap-2.5 transition-all ${mode === 'split' ? 'tab-active' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Scissors className="w-5 h-5" /> PDF分割
                    </button>
                    <button onClick={() => { setMode('ocr'); setFiles([]); setOcrResult(''); setOcrPreviewUrl(null); }} className={`pb-5 px-6 text-sm font-black flex items-center gap-2.5 transition-all ${mode === 'ocr' ? 'tab-active' : 'text-slate-400 hover:text-slate-600'}`}>
                        <FileText className="w-5 h-5" /> OCR (文字起こし)
                    </button>
                </div>
            </header>

            <div className={`grid ${(isDesignCheckEnabled || isRagEnabled) ? 'grid-cols-1 lg:grid-cols-[1fr_350px]' : 'grid-cols-1'} gap-8 mb-20 items-start`}>
                <div className="space-y-8">
                    <div 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
                        onDrop={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            setIsDraggingOver(false); 
                            if (isProcessing) return;
                            console.log("Files dropped", e.dataTransfer.files.length);
                            addFiles(e.dataTransfer.files); 
                        }}
                        onClick={() => {
                            console.log("Drop zone clicked", { isProcessing });
                            if (!isProcessing) fileInputRef.current?.click();
                        }}
                        className={`group relative border-4 border-dashed rounded-[3rem] p-16 text-center transition-all cursor-pointer overflow-hidden ${isDraggingOver ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-slate-200 bg-white hover:border-indigo-300 shadow-xl shadow-slate-200/20'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <input 
                            type="file" 
                            multiple={mode === 'join' || mode === 'ocr'} 
                            accept={mode === 'join' ? ".svg,.pdf,.heic,.heif,.jpg,.jpeg,.png" : (mode === 'ocr' ? ".jpg,.jpeg,.png,.heic,.heif,.pdf,.svg" : ".pdf")} 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={(e) => {
                                console.log("File input changed", e.target.files?.length);
                                addFiles(e.target.files);
                                e.target.value = ''; // Reset to allow same file selection
                            }} 
                        />
                        <div className="relative z-10">
                            {/* Drag Over Processing Indicators */}
                            <AnimatePresence>
                                {isDraggingOver && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute inset-0 -top-24 flex justify-center items-center gap-6 pointer-events-none"
                                    >
                                        {[
                                            { id: 'join', label: '結合', icon: <Plus className="w-5 h-5" />, color: 'bg-emerald-500' },
                                            { id: 'split', label: 'PDF分割', icon: <Scissors className="w-5 h-5" />, color: 'bg-amber-500' },
                                            { id: 'ocr', label: 'OCR', icon: <FileText className="w-5 h-5" />, color: 'bg-indigo-500' }
                                        ].map((item, i) => {
                                            const isActive = mode === item.id;
                                            return (
                                                <div key={i} className={`flex flex-col items-center gap-3 transition-all duration-300 ${isActive ? 'scale-110 opacity-100' : 'scale-90 opacity-20 grayscale'}`}>
                                                    <div className={`w-20 h-20 rounded-3xl ${item.color} shadow-[0_0_30px_rgba(0,0,0,0.2)] flex items-center justify-center text-white ring-4 ring-white ${isActive ? 'animate-bounce' : ''}`} style={{ animationDelay: `${i * 0.15}s` }}>
                                                        {item.icon}
                                                    </div>
                                                    <span className={`font-black text-sm tracking-widest px-4 py-1 rounded-full shadow-lg border-2 border-white text-white ${item.color}`}>{item.label}</span>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {mode === 'ocr' && ocrPreviewUrl ? (
                                <div className="flex flex-col items-center">
                                    <div className="relative w-48 h-48 mb-6 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                                        <img src={ocrPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        {isProcessing && (
                                            <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center">
                                                <RefreshCw className="w-10 h-10 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xl font-black text-slate-800 mb-1 tracking-tight">
                                        {isProcessing ? "画像を解析中..." : "解析完了"}
                                    </p>
                                    <p className="text-slate-400 text-sm font-bold italic">
                                        {isProcessing ? "少々お待ちください" : "別の画像をドロップして再試行"}
                                    </p>
                                </div>
                            ) : files.length > 0 ? (
                                <div className="flex flex-col items-center">
                                    <div className="flex -space-x-8 mb-8">
                                        {files.slice(0, 3).map((f, idx) => (
                                            <div 
                                                key={f.id} 
                                                className="w-24 h-24 bg-white border-4 border-white rounded-2xl shadow-xl overflow-hidden transform"
                                                style={{ 
                                                    transform: `rotate(${(idx - 1) * 10}deg) translateY(${Math.abs(idx - 1) * 10}px)`,
                                                    zIndex: 3 - idx
                                                }}
                                            >
                                                {f.preview ? (
                                                    <img src={f.preview} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                                                        <FileText className="w-8 h-8 text-indigo-400" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {files.length > 3 && (
                                            <div className="w-24 h-24 bg-slate-100 border-4 border-white rounded-2xl shadow-xl flex items-center justify-center transform rotate-[15deg] z-0">
                                                <span className="text-slate-400 font-black">+{files.length - 3}</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                                        {files.length}個のファイルが待機中
                                    </h3>
                                    <p className="text-slate-400 font-bold">
                                        さらに追加するにはドロップまたはクリック
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-24 h-24 bg-indigo-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                                        {mode === 'join' ? <Upload className="w-12 h-12 text-indigo-600" /> : (mode === 'ocr' ? <FileText className="w-12 h-12 text-indigo-600" /> : <Scissors className="w-12 h-12 text-indigo-600" />)}
                                    </div>
                                    <p className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
                                        {mode === 'ocr' ? "画像をドロップ or 貼り付け" : "ファイルをドロップ"}
                                    </p>
                                    <p className="text-slate-400 text-base font-bold italic">
                                        {mode === 'ocr' ? "スクリーンショットのコピペ(Ctrl+V)にも対応" : "SVG, PDF, HEIC, JPG, PNG に対応しています"}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* AIRAG解析結果 / 設計チェック結果 */}
                        {(isRagEnabled || isDesignCheckEnabled) && designCheckResult && (
                            <motion.div 
                                key="analysis-result"
                                ref={resultRef}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mt-10 bg-emerald-50 border border-emerald-100 rounded-[3rem] p-10 shadow-inner"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-sm">
                                            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                                {isRagEnabled ? "AIRAG解析結果" : "設計チェック結果"}
                                            </h3>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                {isRagEnabled ? "AI RAG Analysis Report" : "Design Review Report"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setIsEditingResult(!isEditingResult)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${isEditingResult ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            {isEditingResult ? <><CheckCircle2 className="w-3.5 h-3.5" /> 完了</> : <><Edit3 className="w-3.5 h-3.5" /> 編集 (Canvas)</>}
                                        </button>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(designCheckResult);
                                                showToast("レポートをコピーしました");
                                            }}
                                            className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-200 transition-all flex items-center gap-2"
                                        >
                                            <Copy className="w-3.5 h-3.5" /> コピー
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setDesignCheckResult('');
                                                setIsEditingResult(false);
                                            }}
                                            className="p-3 hover:bg-emerald-100 rounded-full transition-colors"
                                        >
                                            <X className="w-6 h-6 text-emerald-400" />
                                        </button>
                                    </div>
                                </div>
                                <div className={`relative transition-all duration-500 ${isEditingResult ? 'bg-slate-50 rounded-[2rem] p-1' : ''}`}>
                                    {isEditingResult ? (
                                        <div className="relative min-h-[500px] w-full bg-white rounded-[1.8rem] border-2 border-indigo-100 shadow-inner overflow-hidden">
                                            {/* Canvas Grid Background */}
                                            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                            
                                            <textarea 
                                                ref={resultTextareaRef}
                                                value={designCheckResult}
                                                onChange={(e) => setDesignCheckResult(e.target.value)}
                                                placeholder="ここに内容を自由に記述・編集できます..."
                                                className="relative z-10 w-full min-h-[500px] p-10 bg-transparent outline-none font-mono text-sm leading-relaxed text-slate-700 resize-none"
                                            />
                                            
                                            <div className="absolute bottom-6 right-8 z-20 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Canvas Mode Active</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="prose prose-slate max-w-none markdown-body bg-white p-10 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden group">
                                            <div className="markdown-body relative z-10">
                                                {(() => {
                                                    const markdownPart = designCheckResult;

                                                    return (
                                                        <div className="space-y-10">
                                                            {/* Markdown View (Primary) */}
                                                            <div 
                                                                className="markdown-body"
                                                                dangerouslySetInnerHTML={{ __html: marked.parse(markdownPart) as string }}
                                                            />
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <button 
                                                    onClick={() => setIsEditingResult(true)} 
                                                    className="bg-white/80 backdrop-blur-sm border border-emerald-200 p-3 rounded-2xl text-emerald-600 hover:bg-emerald-50 hover:scale-110 shadow-lg shadow-emerald-100/50 transition-all"
                                                    title="編集 (Canvas)"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* OCR抽出結果 */}
                        {ocrResult && (
                            <motion.div 
                                key="ocr-result"
                                ref={ocrResultRef}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`mt-10 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl ${(isRagEnabled || isDesignCheckEnabled) ? 'opacity-90 scale-95' : ''}`}
                            >
                                {(isRagEnabled || isDesignCheckEnabled) ? (
                                    <details className="group" open={false}>
                                        <summary className="flex items-center justify-between cursor-pointer list-none">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-open:rotate-90 transition-transform">
                                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                                </div>
                                                <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-[0.3em]">
                                                    <FileText className="w-5 h-5 text-indigo-500" />
                                                    OCR Result (抽出全データ)
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-open:hidden">クリックで全データを展開</span>
                                                <div className="flex bg-slate-100 p-1 rounded-xl" onClick={(e) => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => setOcrWidthMode('original')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'original' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        原文
                                                    </button>
                                                    <button 
                                                        onClick={() => setOcrWidthMode('full')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'full' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        全角
                                                    </button>
                                                    <button 
                                                        onClick={() => setOcrWidthMode('half')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'half' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        半角
                                                    </button>
                                                </div>
                                            </div>
                                        </summary>
                                        <div className="mt-8 pt-8 border-t border-slate-50">
                                            <div className="flex justify-end mb-4">
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(processedOcrText);
                                                        showToast("クリップボードにコピーしました");
                                                    }}
                                                    className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-all flex items-center gap-2"
                                                >
                                                    <Copy className="w-3.5 h-3.5" /> コピー
                                                </button>
                                            </div>
                                            <div 
                                                className="prose prose-slate max-w-none text-sm font-medium leading-relaxed bg-slate-50 p-8 rounded-2xl border border-slate-100 overflow-x-auto"
                                                dangerouslySetInnerHTML={{ __html: marked.parse(processedOcrText) as string }}
                                            />
                                        </div>
                                    </details>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                                            <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-[0.3em]">
                                                <FileText className="w-5 h-5 text-indigo-500" />
                                                OCR Result (抽出結果)
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                                    <button 
                                                        onClick={() => setOcrWidthMode('original')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'original' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        原文
                                                    </button>
                                                    <button 
                                                        onClick={() => setOcrWidthMode('full')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'full' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        全角
                                                    </button>
                                                    <button 
                                                        onClick={() => setOcrWidthMode('half')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'half' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        半角
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(processedOcrText);
                                                        showToast("クリップボードにコピーしました");
                                                    }}
                                                    className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-all flex items-center gap-2"
                                                >
                                                    <Copy className="w-3.5 h-3.5" /> コピー
                                                </button>
                                                <button 
                                                    onClick={() => setOcrResult('')}
                                                    className="p-3 hover:bg-slate-100 rounded-full transition-colors"
                                                >
                                                    <X className="w-6 h-6 text-slate-400" />
                                                </button>
                                            </div>
                                        </div>
                                        <div 
                                            className="prose prose-slate max-w-none text-sm font-medium leading-relaxed bg-slate-50 p-8 rounded-2xl border border-slate-100 overflow-x-auto"
                                            dangerouslySetInnerHTML={{ __html: marked.parse(processedOcrText) as string }}
                                        />
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {files.length > 0 && (
                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-300/40 border border-slate-100 overflow-hidden animate-slide">
                            <div className="px-10 py-6 bg-slate-50 border-b flex flex-wrap justify-between items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-600 text-white p-2 rounded-xl">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <span className="font-black text-slate-800 text-sm uppercase tracking-widest">
                                        Waitlist ({files.length})
                                    </span>
                                    {files.length > 0 && !isProcessing && (
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log("Clear All button clicked");
                                                setFiles([]);
                                                showToast("リストを空にしました");
                                            }}
                                            className="ml-2 text-[10px] font-black text-rose-500 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl transition-all uppercase tracking-widest border border-rose-100"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    {mode === 'join' && (
                                        <select 
                                            value={outFormat} 
                                            onChange={(e) => setOutFormat(e.target.value)}
                                            className="bg-white border border-slate-200 text-xs font-black rounded-2xl px-5 py-3 outline-none shadow-sm cursor-pointer"
                                        >
                                            <option value="pdf">Output: PDFに結合</option>
                                            <option value="png">Output: 1枚ずつPNGに</option>
                                            <option value="jpeg">Output: 1枚ずつJPEGに</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-[600px] overflow-y-auto">
                                <Reorder.Group 
                                    axis="y" 
                                    values={files} 
                                    onReorder={(newOrder) => {
                                        console.log("Reordered files", newOrder.length);
                                        setFiles(newOrder);
                                    }} 
                                    className="list-none p-0 m-0"
                                >
                                    <AnimatePresence mode="popLayout">
                                        {files.map((item) => (
                                            <Reorder.Item 
                                                key={item.id} 
                                                value={item}
                                                as="li"
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className={`p-6 flex items-center gap-8 hover:bg-indigo-50/20 transition-colors border-b border-slate-50 last:border-0 bg-white ${mode === 'join' && !isProcessing ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                            >
                                                {mode === 'join' && (
                                                    <div className="text-slate-300 hover:text-indigo-400 transition-colors shrink-0">
                                                        <GripVertical className="w-6 h-6" />
                                                    </div>
                                                )}
                                                <div className="w-20 h-20 bg-white border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-md relative">
                                                    <div className="rotate-preview w-full h-full flex items-center justify-center" style={{ transform: `rotate(${item.rotation}deg)` }}>
                                                        {item.preview ? <img src={item.preview} className="object-contain w-full h-full p-2" referrerPolicy="no-referrer" /> : <FileText className="text-indigo-400 w-8 h-8" />}
                                                    </div>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-black text-slate-800 text-lg break-all">
                                                        {item.file?.name || 'Unknown File'}
                                                        {item.pageNum && <span className="ml-2 text-indigo-500">p.{item.pageNum}</span>}
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase">{item.type}</span>
                                                        {item.rotation !== 0 && <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase">{item.rotation}° </span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!isProcessing && (
                                                        <button onClick={() => rotateItem(item.id)} className="text-slate-400 hover:text-indigo-600 p-3 hover:bg-white rounded-2xl transition-all">
                                                            <RefreshCw className="w-6 h-6" />
                                                        </button>
                                                    )}
                                                    {!isProcessing && (
                                                        <button onClick={() => setFiles(files.filter(f => f.id !== item.id))} className="text-slate-300 hover:text-rose-500 p-3 hover:bg-white rounded-2xl transition-all">
                                                            <X className="w-6 h-6" />
                                                        </button>
                                                    )}
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </AnimatePresence>
                                </Reorder.Group>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/30">
                        <h3 className="font-black text-slate-400 flex items-center gap-3 mb-8 uppercase text-xs tracking-[0.3em]">
                            <History className="w-5 h-5 text-indigo-500" />
                            Sessions
                        </h3>
                        {history.length === 0 ? (
                            <div className="py-16 text-center">
                                <p className="text-slate-300 text-sm font-bold italic">履歴はありません</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {history.map(item => (
                                    <div key={item.id} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 animate-slide hover:border-indigo-200 transition-colors group">
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <p className="text-xs font-black text-slate-800 truncate flex-grow break-all" title={item.name}>{item.name}</p>
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg shrink-0 ${item.action === 'JOIN' ? 'bg-indigo-100 text-indigo-600' : item.action === 'CONVERT' ? 'bg-emerald-100 text-emerald-600' : item.action === 'OCR' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                                {item.action}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{item.count} items</span>
                                            {item.url !== "#" && (
                                                <a href={item.url} download={item.name} className="flex items-center gap-1.5 text-xs font-black text-indigo-600">
                                                    <Download className="w-4 h-4" /> DL
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {feedbacks.length > 0 && (
                        <div className="bg-amber-50/50 rounded-[3rem] p-10 border border-amber-100 shadow-xl shadow-amber-200/20 animate-slide">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-black text-amber-600 flex items-center gap-3 uppercase text-xs tracking-[0.3em]">
                                    <MessageSquare className="w-5 h-5" />
                                    Received Requests (届いた要望)
                                </h3>
                                <button 
                                    onClick={downloadFeedbackCSV}
                                    className="bg-white border border-amber-200 text-amber-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-amber-100 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" /> CSV出力
                                </button>
                            </div>
                            <div className="space-y-4">
                                {feedbacks.map(fb => (
                                    <div key={fb.id} className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm relative group">
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed mb-3">{fb.text}</p>
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{fb.time}</span>
                                            <button 
                                                onClick={() => {
                                                    const updated = feedbacks.filter(f => f.id !== fb.id);
                                                    setFeedbacks(updated);
                                                    localStorage.setItem('ostrich_feedbacks', JSON.stringify(updated));
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 text-[10px] font-black uppercase transition-all"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 text-center">
                                <p className="text-[10px] text-amber-500 font-bold italic">※これらは現在このブラウザにのみ保存されています</p>
                            </div>
                        </div>
                    )}
                </div>

                {(isDesignCheckEnabled || isRagEnabled) && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border-4 border-emerald-100 rounded-[3rem] p-8 shadow-xl shadow-emerald-100/20 flex flex-col gap-6 sticky top-8"
                    >
                        <div className="flex items-center gap-3 border-b border-emerald-50 pb-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-800">解析・チェック指示</h4>
                                <p className="text-[10px] font-bold text-slate-400">AIへの追加リクエスト</p>
                            </div>
                        </div>
                        
                        <div className="flex-grow flex flex-col gap-3">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">カスタムプロンプト</label>
                            <textarea 
                                value={designCheckCustomPrompt}
                                onChange={(e) => setDesignCheckCustomPrompt(e.target.value)}
                                placeholder="例：平面図と立面図だけのチェックである。アンテナの高さに注目して。"
                                className="w-full h-64 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-slate-700 outline-none focus:border-emerald-300 transition-all resize-none"
                            />
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                                ※具体的な指示を入力することで、より精度の高い解析結果が得られます。
                            </p>
                        </div>

                        {designCheckCustomPrompt && (
                            <button 
                                onClick={() => setDesignCheckCustomPrompt("")}
                                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-black transition-all flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" /> 指示をクリア
                            </button>
                        )}
                    </motion.div>
                )}
            </div>

            <div className="fixed bottom-8 right-8 flex flex-col items-end gap-3">
                <button onClick={() => setShowChangelog(true)} className="bg-white/95 backdrop-blur shadow-2xl border border-slate-200 px-6 py-3 rounded-full text-xs font-black text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    {APP_VERSION}
                </button>
            </div>

            <AnimatePresence>
                {showChangelog && (
                    <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-6" onClick={() => setShowChangelog(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Logs</h2>
                                <button onClick={() => setShowChangelog(false)} className="p-3 hover:bg-slate-200 rounded-full">
                                    <X className="w-8 h-8 text-slate-400" />
                                </button>
                            </div>
                            <div className="p-10 max-h-[65vh] overflow-y-auto space-y-10">
                                {CHANGE_LOGS.map((log) => (
                                    <div key={log.version} className="relative pl-10 border-l-2 border-indigo-100 last:border-0 pb-4">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-4 border-indigo-500"></div>
                                        <div className="mb-4 flex items-center gap-4">
                                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl shadow-sm">{log.version}</span>
                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{log.date}</span>
                                        </div>
                                        <h4 className="font-black text-slate-900 text-lg mb-4">{log.title}</h4>
                                        <ul className="space-y-3">
                                            {log.details.map((d, i) => (
                                                <li key={i} className="text-base text-slate-500 flex items-start gap-3">
                                                    <span className="text-indigo-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400"></span> {d}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <div className="p-8 bg-slate-900 text-center">
                                <p className="text-xs text-slate-500 font-black tracking-[0.5em] uppercase italic">Ostrich Egg Hatching Utility</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
=======
import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import heic2any from 'heic2any';
import { marked } from 'marked';
import JSZip from 'jszip';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Upload, FileText, X, History, Download, Menu, 
  Scissors, RefreshCw, Link as LinkIcon, Mail, 
  HelpCircle, MessageSquare, Plus, Copy, CheckCircle2,
  GripVertical, Edit3, ChevronRight, Play
} from 'lucide-react';

interface FileItem {
    id: string;
    file: File;
    preview: string | null;
    type: string;
    rotation: number;
    pageNum?: number;
    totalPage?: number;
    originalName?: string;
}

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const APP_VERSION = "v3.8.1";
const CHANGE_LOGS = [
    { version: "v3.8.0", date: "2024-06-12", title: "Gemini OCR 搭載", details: ["画像からテキストや表を抽出するOCR機能を追加。","Gemini 3 Flashによる高精度な文字起こし。"] },
    { version: "v3.7.0", date: "2024-06-11", title: "JPEG/PNG画像サポート", details: ["JPEG/JPG/PNG画像をPDFへ直接結合できる機能を追加。","画像ファイルのプレビュー表示をサポート。"] },
    { version: "v3.6.0", date: "2024-06-10", title: "HEIC/HEIF対応", details: ["iPhone等で撮影されたHEIC画像をドロップ可能に。","HEICからJPEG/PDFへの一括変換をサポート。"] }
];

// --- Components ---

const Ostrich = ({ isActive, isLaying, isSearching, enabled = true, animationsEnabled = true }: { isActive: boolean, isLaying: boolean, isSearching: boolean, enabled?: boolean, animationsEnabled?: boolean }) => {
    if (!enabled) return null;
    const statusClass = isActive ? 'running' : (isSearching ? 'searching' : (isLaying ? 'laying' : 'sleeping'));
    
    return (
        <div className={`ostrich-wrapper ${isActive ? 'ostrich-active' : ''} ${!animationsEnabled ? 'no-animation' : ''}`}>
            <div className={`ostrich-sprite ${statusClass}`}>
                <svg viewBox="0 -65 120 200" xmlns="http://www.w3.org/2000/svg">
                    {isLaying && (
                        <g>
                            <ellipse className="egg-element" cx="45" cy="80" rx="8" ry="11" />
                            <circle className="sparkle-effect" cx="45" cy="125" r="3" />
                        </g>
                    )}
                    <g className="leg-group">
                        <path className="ostrich-skin" d="M42 85 L38 125" strokeWidth="4.5" strokeLinecap="round" stroke="#e2ccb5" fill="none" />
                        <path className="ostrich-skin" d="M58 85 L62 125" strokeWidth="4.5" strokeLinecap="round" stroke="#e2ccb5" fill="none" />
                        <path d="M38 125 L32 125 M62 125 L68 125" stroke="#e2ccb5" strokeWidth="3" strokeLinecap="round" />
                    </g>
                    <ellipse className="ostrich-body-main" cx="50" cy="70" rx="40" ry="28" />
                    <circle cx="25" cy="60" r="10" className="ostrich-body-main" />
                    <circle cx="75" cy="65" r="12" className="ostrich-body-main" />
                    <path className="ostrich-tail" d="M12 70 Q5 60 0 70 Q5 85 12 75" fill="#fff" opacity="0.9" />
                    <g className="neck-group" style={{ transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', transformOrigin: '72px 55px' }}>
                        <path className="ostrich-skin" d="M72 55 C82 30, 78 -5, 92 0" strokeWidth="8" fill="none" stroke="#e2ccb5" strokeLinecap="round" />
                        <circle className="ostrich-skin" cx="92" cy="0" r="7" />
                        <circle className="ostrich-eye-white" cx="93" cy="-2" r="3.5" />
                        <circle className="ostrich-eye-pupil" cx="93.5" cy="-2.2" r={isSearching ? 2.5 : 1.8} />
                        <path className="ostrich-beak" d="M96 0 L108 2 L96 4 Z" fill="#fbbf24" />
                    </g>
                </svg>
            </div>
        </div>
    );
};

const OstrichEggButton = ({ onClick }: { onClick: () => void }) => {
    const [isCracking, setIsCracking] = useState(false);

    const handleClick = () => {
        setIsCracking(true);
        setTimeout(() => {
            onClick();
            setIsCracking(false);
        }, 800);
    };

    return (
        <button 
            onClick={handleClick}
            className={`fixed top-6 right-6 z-[60] group transition-transform hover:scale-110 active:scale-95 ${isCracking ? 'pointer-events-none' : ''}`}
            title="取扱説明書"
        >
            <div className={`relative ${isCracking ? 'cracking' : ''}`}>
                <svg width="100" height="120" viewBox="-10 -10 100 120" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
                    <g className="egg-upper">
                        <path d="M10 50 C10 20 30 5 50 5 C70 5 90 20 90 50 L90 55 L75 45 L60 55 L45 45 L30 55 L15 45 L10 55 Z" 
                              fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" transform="translate(-10, 0)" />
                    </g>
                    <g className="egg-lower">
                        <path d="M10 50 C10 80 30 95 50 95 C70 95 90 80 90 50 L90 45 L75 55 L60 45 L45 55 L30 45 L15 55 L10 45 Z" 
                              fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" transform="translate(-10, 0)" />
                    </g>
                </svg>
                {!isCracking && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[14px] w-8 h-8 flex items-center justify-center rounded-full opacity-100 group-hover:bg-indigo-700 transition-all whitespace-nowrap font-black shadow-lg border-2 border-white">
                        ?
                    </div>
                )}
            </div>
        </button>
    );
};

const ManualModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-6" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20" 
                onClick={e => e.stopPropagation()}
            >
                <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                            <svg width="30" height="40" viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
                                <ellipse cx="30" cy="40" rx="25" ry="35" fill="#fffaf0" stroke="#e2ccb5" strokeWidth="2" />
                                <path d="M10 40 L20 35 L30 40 L40 35 L50 40" fill="none" stroke="#e2ccb5" strokeWidth="1" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">取扱説明書</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ostrich Egg Manual</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-8 h-8 text-slate-400" />
                    </button>
                </div>
                <div className="p-10 overflow-y-auto space-y-10">
                    <section>
                        <h3 className="text-xl font-black text-indigo-600 mb-5 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs shadow-sm">1</span>
                            結合・変換モード
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-slate-600 font-medium leading-relaxed">
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-colors">
                                <p className="font-black text-slate-800 mb-3 text-base">PDFに結合</p>
                                <p>複数のSVG、PDF、画像（JPEG/PNG/HEIC）を1つのPDFファイルにまとめます。ドラッグ＆ドロップで順番を自由に入れ替え可能です。</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-colors">
                                <p className="font-black text-slate-800 mb-3 text-base">画像に変換</p>
                                <p>PDFやSVGを1ページ（1枚）ずつ画像として書き出します。大量のファイルを一括で処理するのに最適です。</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-indigo-600 mb-5 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs shadow-sm">2</span>
                            PDF分割モード
                        </h3>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm text-slate-600 font-medium leading-relaxed hover:border-indigo-200 transition-colors">
                            <p>1つのPDFファイルをページごとにバラバラのPDFファイルとして保存します。特定のページだけ抽出したい場合に便利です。</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-indigo-600 mb-5 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs shadow-sm">3</span>
                            OCR (文字起こし)
                        </h3>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm text-slate-600 font-medium leading-relaxed hover:border-indigo-200 transition-colors">
                            <p className="mb-3">画像をドロップすると、Gemini AIがテキストや表を抽出します。手書き文字や複雑なレイアウトの表も高精度で読み取ります。</p>
                            <p className="text-xs text-slate-400 font-bold">※「AIRAG解析」や「設計チェック」がOFFの場合に実行されます。</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-indigo-600 mb-5 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs shadow-sm">4</span>
                            AIRAG解析 (高度解析)
                        </h3>
                        <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 text-sm text-slate-600 font-medium leading-relaxed hover:border-indigo-200 transition-colors">
                            <p className="mb-3 font-black text-indigo-700">外部データベース（RAG）と連携した、最も高度な解析機能です。</p>
                            <p>画面上部の「AIRAG解析」をONにすると、外部から取得した最新の局情報と図面を照らし合わせ、データの不一致や整合性を詳細にチェックします。出力は設計チェックレポートの形式で行われます。</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-emerald-600 mb-5 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-xs shadow-sm">5</span>
                            設計チェック機能 & 通知
                        </h3>
                        <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 text-sm text-slate-600 font-medium leading-relaxed hover:border-emerald-200 transition-colors">
                            <p className="mb-3 font-black text-emerald-700">通信基地局の設計図面レビューに特化した専門機能です。</p>
                            <p className="mb-4">画面上部の「設計チェック」をONにすると、結合・分割・OCRのどの操作時でも、AIが図面の内容（局名、設備数、仮設計画など）を自動で解析し、指摘事項をレポートとして出力します。特に「局番号・局名の一致」「図番の連番性」「凡例ルール（新設＝赤/撤去＝青）」などを重点的にチェックします。</p>
                            
                            <div className="bg-white/60 p-5 rounded-2xl border border-emerald-100/50 space-y-3">
                                <p className="font-black text-emerald-800 text-xs uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    設計チェックON時の特別通知
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-[13px]">
                                    <li><span className="font-bold">タブタイトルの変化:</span> 処理中は「処理中…」、完了すると「完了 ●」にタイトルとアイコンが変わります。</li>
                                    <li><span className="font-bold">サウンド通知:</span> 完了時に「ピコーン」と音が鳴ります。</li>
                                    <li><span className="font-bold">ブラウザ通知:</span> 別タブを開いていても、完了時にデスクトップ通知でお知らせします。</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] shadow-inner">
                        <h4 className="font-black text-amber-800 text-base mb-3 flex items-center gap-3">
                            <HelpCircle className="w-5 h-5" />
                            ヒント
                        </h4>
                        <p className="text-sm text-amber-700 font-bold leading-relaxed">
                            iPhoneで撮影した写真（HEIC形式）もそのまま放り込んでOK！自動的にJPEGに変換して処理します。ダチョウが走っている間は処理中です。卵を産んだら完了の合図です。設計チェックON時は、タブタイトルやサウンド、ブラウザ通知でも完了をお知らせします。
                        </p>
                    </div>

                    <section className="pt-4">
                        <h3 className="text-xl font-black text-indigo-600 mb-6 flex items-center gap-3">
                            <MessageSquare className="w-6 h-6" />
                            よくあるご質問 (Q&A)
                        </h3>
                        <div className="space-y-4">
                            {[
                                { q: "処理が途中で止まってしまったら？", a: "右下の「停止」ボタンを押して一度リセットし、再度ファイルを投入してください。" },
                                { q: "一度に何個までファイルを入れられますか？", a: "特に制限はありませんが、数が多い場合は処理に時間がかかることがあります。" },
                                { q: "OCR（文字起こし）がうまくいかない...", a: "画像が鮮明であることを確認してください。Gemini AIが複雑なレイアウトも解析しますが、極端に暗い画像やボケた画像は苦手です。" },
                                { q: "結合したPDFの順番を入れ替えたい", a: "画面上のファイルカードをドラッグ＆ドロップすることで、自由に順番を入れ替えることができます。" },
                                { q: "保存先はどこですか？", a: "ブラウザの「ダウンロード」フォルダに保存されます。複数のファイルを書き出す場合は、1つのZIPファイルにまとめてダウンロードされます。" },
                                { q: "iPhoneの写真は使えますか？", a: "はい、HEIC形式の写真も自動的に変換して処理します。安心してお使いください。" },
                                { q: "設計チェックはどうやって使いますか？", a: "画面上部の「設計チェック」スイッチをONにしてから、通常通りファイルをドロップしてください。処理完了後にエメラルド色のレポートが表示されます。" }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                    <p className="font-black text-indigo-600 mb-2 flex items-center gap-2">
                                        <span className="text-xs bg-indigo-100 px-2 py-0.5 rounded-full">Q</span>
                                        {item.q}
                                    </p>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed pl-6 border-l-2 border-slate-200 ml-2">
                                        {item.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
                <div className="p-8 bg-slate-900 text-center">
                    <p className="text-[10px] text-slate-500 font-black tracking-[0.5em] uppercase italic">Ostrich Egg Hatchery Manual</p>
                </div>
            </motion.div>
        </div>
    );
};

const FeedbackModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (text: string) => void }) => {
    const [text, setText] = useState('');
    if (!isOpen) return null;

    const handleSend = () => {
        if (!text.trim()) return;
        onSubmit(text);
        setText('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] modal-overlay flex items-center justify-center p-6" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100" 
                onClick={e => e.stopPropagation()}
            >
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-amber-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shadow-sm">
                            <MessageSquare className="w-6 h-6 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">ご要望・改善案</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">ご要望は？</label>
                        <textarea 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="「ここをこうしてほしい」「こんな機能がほしい」など、お気軽に入力してください。"
                            className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 px-6 py-3.5 rounded-2xl font-black text-slate-400 hover:bg-slate-100 transition-all text-xs uppercase tracking-widest">
                            キャンセル
                        </button>
                        <button 
                            onClick={handleSend}
                            disabled={!text.trim()}
                            className="flex-[2] bg-amber-500 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-amber-600 disabled:bg-slate-200 transition-all text-xs uppercase tracking-widest shadow-lg shadow-amber-100"
                        >
                            送信する
                        </button>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold italic">メンバーの皆様の声でダチョウは進化します</p>
                </div>
            </motion.div>
        </div>
    );
};

const fetchRagDataFromGas = async (setStatusMessage?: (msg: string) => void, isCancelledRef?: React.MutableRefObject<boolean>, setIsFetchingRag?: (val: boolean) => void) => {
    const gasUrl = import.meta.env.VITE_GAS_URL;
    if (!gasUrl) {
        console.warn("VITE_GAS_URL is not set. Skipping RAG data fetch.");
        return null;
    }
    
    // タイムアウト設定（10秒に短縮）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        console.log("Fetching RAG data from GAS...");
        if (setStatusMessage) setStatusMessage("RAG知識データを取得しています...");
        if (setIsFetchingRag) setIsFetchingRag(true);
        
        if (isCancelledRef?.current) throw new Error("CANCELLED");

        const response = await fetch(gasUrl, { 
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);
        
        if (isCancelledRef?.current) throw new Error("CANCELLED");

        if (!response.ok) throw new Error(`GAS fetch failed: ${response.status} ${response.statusText}`);
        
        const data = await response.json();
        console.log("RAG data fetched successfully");
        if (setIsFetchingRag) setIsFetchingRag(false);
        return data;
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (setIsFetchingRag) setIsFetchingRag(false);
        if (err.message === "CANCELLED") {
            console.log("RAG fetch cancelled by user.");
            throw err;
        }
        if (err.name === 'AbortError') {
            console.error("GAS fetch timed out after 10 seconds.");
            if (setStatusMessage) setStatusMessage("RAGデータの取得がタイムアウトしました（10秒）。スキップします。");
        } else {
            console.error("Error fetching RAG data from GAS:", err);
            if (setStatusMessage) setStatusMessage(`RAGデータの取得に失敗しました: ${err.message}`);
        }
        // エラー時はnullを返して続行できるようにする
        return null;
    }
};

// --- Main App ---

export default function App() {
    const [mode, setMode] = useState(() => localStorage.getItem('ostrich_mode') || 'ocr');
    const [outFormat, setOutFormat] = useState('pdf');
    const [files, setFiles] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLayingEgg, setIsLayingEgg] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [showChangelog, setShowChangelog] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isFetchingRag, setIsFetchingRag] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);
    const isCancelledRef = useRef(false);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [ocrResult, setOcrResult] = useState('');
    const [designCheckResult, setDesignCheckResult] = useState('');
    const [ocrWidthMode, setOcrWidthMode] = useState<'original' | 'full' | 'half'>('original');
    const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | null>(null);
    const [ostrichEnabled, setOstrichEnabled] = useState(true);
    const [animationsEnabled, setAnimationsEnabled] = useState(true);
    const [isDesignCheckEnabled, setIsDesignCheckEnabled] = useState(() => {
        const saved = localStorage.getItem('ostrich_design_check');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isRagEnabled, setIsRagEnabled] = useState(() => {
        const saved = localStorage.getItem('ostrich_rag_enabled');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [isEditingResult, setIsEditingResult] = useState(false);
    const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('ostrich_selected_model') || 'gemini-3-flash-preview');
    const [designCheckCustomPrompt, setDesignCheckCustomPrompt] = useState("");
    const resultTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Persistence for settings
    useEffect(() => {
        localStorage.setItem('ostrich_mode', mode);
    }, [mode]);

    useEffect(() => {
        localStorage.setItem('ostrich_design_check', JSON.stringify(isDesignCheckEnabled));
    }, [isDesignCheckEnabled]);

    useEffect(() => {
        localStorage.setItem('ostrich_rag_enabled', JSON.stringify(isRagEnabled));
    }, [isRagEnabled]);

<<<<<<< HEAD
=======
    useEffect(() => {
        localStorage.setItem('ostrich_selected_model', selectedModel);
    }, [selectedModel]);

>>>>>>> ec41c49 (feat: 設計チェック、AI解析を個別に出力変更)
    // Auto-resize textarea for design check result
    useEffect(() => {
        if (isEditingResult && resultTextareaRef.current) {
            resultTextareaRef.current.style.height = 'auto';
            resultTextareaRef.current.style.height = `${resultTextareaRef.current.scrollHeight}px`;
        }
    }, [designCheckResult, isEditingResult]);
    const [isTabFocused, setIsTabFocused] = useState(true);
    const originalTitle = useRef(document.title);
    const originalFavicon = useRef<string | null>(null);

    // Notification permission
    useEffect(() => {
        if (isDesignCheckEnabled && "Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, [isDesignCheckEnabled]);

    // Favicon helper
    const setFavicon = (emoji: string) => {
        const canvas = document.createElement('canvas');
        canvas.height = 32;
        canvas.width = 32;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.font = '28px serif';
            ctx.fillText(emoji, 0, 28);
            const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = canvas.toDataURL();
            document.getElementsByTagName('head')[0].appendChild(link);
        }
    };

    // Tab focus and reset logic
    useEffect(() => {
        if (isProcessing) {
            document.title = `(${progress}%) 処理中... PDFツール`;
        } else {
            document.title = originalTitle.current;
        }
    }, [isProcessing, progress]);

    useEffect(() => {
        const handleFocus = () => {
            setIsTabFocused(true);
            document.title = originalTitle.current;
            if (originalFavicon.current) {
                const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
                if (link) link.href = originalFavicon.current;
            }
        };
        const handleBlur = () => setIsTabFocused(false);

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        // Store original favicon
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (link) originalFavicon.current = link.href;

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    // Processing status notifications
    useEffect(() => {
        if (!isDesignCheckEnabled) return;

        if (isProcessing) {
            document.title = "処理中… PDFツール";
            setFavicon("⏳");
        }
    }, [isProcessing, isDesignCheckEnabled]);

    // Audio helper
    const playPikon = () => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); // E6

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    };

    const notifyCompletion = () => {
        if (!isDesignCheckEnabled) return;

        document.title = "完了 ● PDFツール";
        setFavicon("✅");
        playPikon();

        if (!isTabFocused && "Notification" in window && Notification.permission === "granted") {
            new Notification("解析完了", {
                body: "PDFの処理と設計チェックが完了しました。",
                icon: "/favicon.ico"
            });
        }
    };
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("リンクをコピーしました");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg = "リンクをコピーしました") => {
        setToastMessage(msg);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2000);
    };

    useEffect(() => {
        const savedFeedbacks = localStorage.getItem('ostrich_feedbacks');
        if (savedFeedbacks) setFeedbacks(JSON.parse(savedFeedbacks));
    }, []);

    const handleFeedbackSubmit = (text: string) => {
        const newFeedback = {
            id: Date.now(),
            text,
            time: new Date().toLocaleString(),
            status: 'new'
        };
        const updated = [newFeedback, ...feedbacks];
        setFeedbacks(updated);
        localStorage.setItem('ostrich_feedbacks', JSON.stringify(updated));
        
        // GAS環境（スプレッドシート）への送信
        const isGasEnv = typeof (window as any).google !== 'undefined' && (window as any).google.script && (window as any).google.script.run;
        
        if (isGasEnv) {
            try {
                (window as any).google.script.run
                    .withSuccessHandler(() => showToast("スプレッドシートに保存しました！"))
                    .withFailureHandler((err: any) => {
                        console.error("GAS Error:", err);
                        showToast("送信失敗: スプレッドシート側の権限を確認してください");
                    })
                    .saveFeedback(text);
            } catch (e) {
                showToast("GAS実行エラーが発生しました");
            }
        } else {
            showToast("送信完了（ブラウザに保存されました）");
        }
    };

    const downloadFeedbackCSV = () => {
        if (feedbacks.length === 0) return;
        const headers = ["ID", "Time", "Content"];
        const rows = feedbacks.map(f => [f.id, f.time, `"${f.text.replace(/"/g, '""')}"`]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        download(url, `ostrich_feedback_${Date.now()}.csv`);
    };

    const copyAppLink = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast();
    };

    const renderPdfPageToCanvas = async (pdf: any, pageNum: number, rotationOffset: number) => {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5, rotation: rotationOffset });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error("Canvas context not found");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext: any = { canvasContext: context, viewport: viewport };
        await page.render(renderContext).promise;
        return canvas;
    };

    const renderPdfToCanvas = async (file: File, pageNum: number, rotationOffset: number) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        return renderPdfPageToCanvas(pdf, pageNum, rotationOffset);
    };

    const triggerEggAnimation = () => {
        setIsLayingEgg(true);
        setTimeout(() => setIsLayingEgg(false), 3000);
    };

    const addHistoryItem = (name: string, url: string, count: number, action: string) => {
        setHistory(prev => [{ id: Date.now(), name, url, count, action, time: new Date().toLocaleString() }, ...prev]);
    };

    const rotateItem = (id: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f));
    };

    const handleOCRFiles = async (explicitUseRag?: boolean) => {
        const useRag = explicitUseRag !== undefined ? explicitUseRag : isRagEnabled;
        if (files.length === 0) return;
        setIsProcessing(true);
        setIsCancelled(false);
        isCancelledRef.current = false;
        setProgress(10);
        setStatusMessage(useRag ? "RAG解析を実行中..." : "図面チェックを実行中...");
        setOcrResult('');
        setDesignCheckResult('');
        setOcrWidthMode('original');
        
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("API_KEY_MISSING");
            const ai = new GoogleGenAI({ apiKey });

            let parts: any[] = [];
            let previewUrl = '';

            for (let fIdx = 0; fIdx < files.length; fIdx++) {
                const item = files[fIdx];
                const fileProgressStart = 10 + (fIdx / files.length) * 30;
                const fileProgressEnd = 10 + ((fIdx + 1) / files.length) * 30;

                if (isCancelledRef.current) throw new Error("CANCELLED");
                setProgress(fileProgressStart);

                const { canvas } = await getProcessedCanvas(item);
                const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
                if (!previewUrl) previewUrl = canvas.toDataURL('image/jpeg', 0.4);
                
                setProgress(fileProgressEnd);
            }
            
            setOcrPreviewUrl(previewUrl);
            
            if (isCancelledRef.current) throw new Error("CANCELLED");
            setProgress(40);

            // GASからプロンプトとRAGデータを取得
            const ragData = useRag ? await fetchRagDataFromGas(setStatusMessage, isCancelledRef, setIsFetchingRag) : null;

            let prompt = "この画像からテキストを抽出してください。表がある場合はMarkdown形式のテーブルとして出力してください。出力は日本語でお願いします。";
            
            if (useRag || isDesignCheckEnabled) {
                setStatusMessage("Gemini AIが解析中...");
                const jsonStructure = useRag ? `{
  "局番号": "",
  "局名": "",
  "図面Rev": "",
  "既設": {
    "周波数": "",
    "セクタ数": "",
    "アンテナ": "",
    "RU": ""
  },
  "新設": {
    "周波数": "",
    "セクタ数": "",
    "アンテナ": "",
    "RU": ""
  },
  "認証型式": "",
  "機器名称": "",
  "DU_MU": "",
  "伝送装置": "",
  "WDM": "",
  "RAN判定": "",
  "図面種類判定": "",
  "図面整合チェック": {
    "局番号一致": "",
    "局名一致": "",
    "図番連番": "",
    "欠番": "",
    "重複": "",
    "目次一致": "",
    "詳細": ""
  },
  "凡例ルールチェック": {
    "凡例": "",
    "新設＝赤": "",
    "撤去＝青": "",
    "詳細": ""
  },
  "図面内容チェック": "",
  "仮設工事チェック": "",
  "根拠": "",
  "不明点": "",
  "信頼度": ""
}` : `{
  "局番号": "",
  "局名": "",
  "図面Rev": "",
  "図面種類判定": "",
  "図面整合チェック": {
    "局番号一致": "",
    "局名一致": "",
    "図番連番": "",
    "欠番": "",
    "重複": "",
    "目次一致": "",
    "詳細": ""
  },
  "凡例ルールチェック": {
    "凡例": "",
    "新設＝赤": "",
    "撤去＝青": "",
    "詳細": ""
  },
  "図面内容チェック": "",
  "仮設工事チェック": "",
  "根拠": "",
  "不明点": "",
  "信頼度": ""
}`;

                const markdownFormat = useRag ? `
# 設計チェック結果

## 概要
- 局番号：
- 局名：
- 図面Rev：
- RAN：

---

## 既設設備
- 周波数：
- セクタ数：
- アンテナ：
- RU：

---

## 新設設備
- 周波数：
- セクタ数：
- アンテナ：
- RU：

---

## 構成
- DU/MU：
- 伝送装置：
- WDM：

---

## 機器
- 機器名称：

---

## チェック項目
### ① 図面種類判定
- 

### ② 図面整合チェック
- 局番号一致：
- 局名一致：
- 図番連番：
- 欠番：
- 重複：
- 目次一致：
- 詳細：

### ③ 凡例ルールチェック
- 凡例：
- 新設＝赤：
- 撤去＝青：
- 詳細：

### ④ 図面内容チェック
- 

### ⑤ 仮設工事チェック
- 

---

## 根拠
-

---

## 不明点
-

---

## 信頼度
-
---

## OCR抽出データ
- 
` : `
# 設計チェック結果

## 概要
- 局番号：
- 局名：
- 図面Rev：

---

## チェック項目
### ① 図面種類判定
- 

### ② 図面整合チェック
- 局番号一致：
- 局名一致：
- 図番連番：
- 欠番：
- 重複：
- 目次一致：
- 詳細：

### ③ 凡例ルールチェック
- 凡例：
- 新設＝赤：
- 撤去＝青：
- 詳細：

### ④ 図面内容チェック
- 

### ⑤ 仮設工事チェック
- 

---

## 根拠
-

---

## 不明点
-

---

## 信頼度
-
---

## OCR抽出データ
- 
`;

                const outputInstruction = `
【出力形式（厳守）】
出力は以下の2部構成とし、その間を「---」で区切ること：

① Markdown（最初に出力）
② OCR抽出データ（「## OCR抽出データ」という見出しの後に、画像から読み取れる全てのテキストを詳細に抽出してください。表がある場合はMarkdown形式のテーブルとして出力し、図面内の全ての文字情報を網羅してください。要約は禁止です。全データを抽出してください。）

Markdownは人間可読用とする。
自然文・説明文・前置き・後置きは禁止。

Markdownの形式（固定）：
${markdownFormat}
`;

                if (ragData && ragData.prompt) {
                    // GASから取得したプロンプトを使用
                    let knowledge = ragData.ragData || "データなし";
                    // 知識データが大きすぎる場合は切り詰める
                    if (knowledge.length > 30000) {
                        knowledge = knowledge.substring(0, 30000) + "...(データ過多のため省略)";
                    }

                    prompt = `【RAG解析結果】
以下は事前に取得された図面情報である。
この情報を優先参照すること。

${knowledge}

---

【解析指示】
上記のRAG解析結果および入力PDFを基に、以下のチェックを実行する。

① 図面種類判定
② 図面整合チェック（局番号・局名の一致、図番の連番・欠番・重複、目次との整合性）
③ 凡例ルールチェック（凡例の有無、新設＝赤・撤去＝青のルール遵守）
④ 図面内容チェック
⑤ 仮設工事チェック

${outputInstruction}

---

【制約】
・RAG情報を優先して判断すること
・RAG未記載事項のみPDFから補完すること
・推測禁止
・一部ページのみで判断禁止
・最初の検出で処理終了禁止
・キー名は変更禁止
・キーの欠落禁止（不明な場合は「不明」と記載）
・配列ではなく文字列で返す
・改行や装飾は禁止

${designCheckCustomPrompt ? `【追加指示】\n${designCheckCustomPrompt}\n` : ""}

【対象ファイル】
${files.length > 1 ? `${files[0].file.name} 他${files.length - 1}件` : files[0].file.name}`;
                } else {
                    // 標準の設計チェックプロンプト
                    prompt = `あなたは通信基地局の設計図面をチェックする専門家です。
画像から情報を読み取り、以下の項目についてチェックを行ってください。

【チェック項目】
① 図面種類判定：図面の種類（系統図、配置図、平面図など）を判定してください。
② 図面整合チェック：局番号・局名の一致、図番の連番・欠番・重複、目次との整合性を確認してください。
③ 凡例ルールチェック：凡例の有無、および「新設＝赤」「撤去＝青」のルールが守られているか確認してください。
④ 図面内容チェック：必要な設備情報が正しく記載されているか確認してください。
⑤ 仮設工事チェック：仮設工事に関する記述がある場合、その内容を確認してください。

${outputInstruction}

---

【制約】
・推測禁止
・一部ページのみで判断禁止
・最初の検出で処理終了禁止
・キー名は変更禁止
・キーの欠落禁止（不明な場合は「不明」と記載）
・配列ではなく文字列で返す
・改行や装飾は禁止
・画像から読み取れない項目は「不明」と記載してください。
・推測はせず、事実のみを抽出してください。
・出力は日本語でお願いします。

${designCheckCustomPrompt ? `【追加指示】\n${designCheckCustomPrompt}\n` : ""}

【対象ファイル】
${files.length > 1 ? `${files[0].file.name} 他${files.length - 1}件` : files[0].file.name}`;
                }
            }

            const response = await ai.models.generateContent({
                model: selectedModel,
                contents: {
                    parts: [
                        { text: prompt },
                        ...parts
                    ]
                },
                config: {
<<<<<<< HEAD
                    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
=======
                    thinkingConfig: { 
                        thinkingLevel: selectedModel.includes('pro') ? ThinkingLevel.HIGH : ThinkingLevel.LOW 
                    }
>>>>>>> ec41c49 (feat: 設計チェック、AI解析を個別に出力変更)
                }
            });
            
            if (isCancelledRef.current) throw new Error("CANCELLED");

            const text = response.text || "";
            
            // 解析結果の振り分け
            const ocrMarkers = ["## OCR抽出データ", "### OCR抽出データ", "OCR抽出データ:", "【OCR抽出データ】"];
            let foundMarker = "";
            for (const marker of ocrMarkers) {
                if (text.includes(marker)) {
                    foundMarker = marker;
                    break;
                }
            }

            if (foundMarker) {
                const parts = text.split(foundMarker);
                const mainResult = parts[0].trim();
                const ocrPart = parts[1].trim();
                
                setDesignCheckResult(mainResult);
                setOcrResult(ocrPart);
                triggerEggAnimation();
                setTimeout(() => {
                    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                if (useRag || isDesignCheckEnabled) {
                    setDesignCheckResult(text);
                    triggerEggAnimation();
                    setTimeout(() => {
                        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                } else {
                    setOcrResult(text);
                    setDesignCheckResult("");
                }
            }

            addHistoryItem(`${useRag ? 'AIRAG解析' : isDesignCheckEnabled ? '設計チェック' : 'OCR抽出'}: ${files.length > 1 ? `${files[0].file.name} 他${files.length - 1}件` : files[0].file.name}`, "#", files.length, 'OCR');
            showToast("処理が完了しました");
            setProgress(100);
        } catch (err: any) {
            if (err.message === "CANCELLED") {
                showToast("キャンセルされました");
            } else {
                console.error("OCR Error:", err);
                const errorMsg = err.message === "API_KEY_MISSING" 
                    ? "APIキーが設定されていません。" 
                    : "エラーが発生しました。ファイル形式を確認してください。";
                showToast(errorMsg);
            }
        } finally {
            setIsProcessing(false);
            setIsCancelled(false);
            isCancelledRef.current = false;
            setProgress(0);
            setStatusMessage("");
        }
    };

    const addFiles = React.useCallback(async (newFiles: FileList | File[] | null) => {
        console.log("addFiles execution started", { count: newFiles?.length, mode });
        if (!newFiles || newFiles.length === 0) return;

        const accepted = mode === 'join' ? /\.(svg|pdf|heic|heif|jpg|jpeg|png)$/i : (mode === 'ocr' ? /\.(jpg|jpeg|png|heic|heif|pdf|svg)$/i : /\.pdf$/i);
        const filtered = Array.from(newFiles).filter(f => f.name.match(accepted));
        console.log("Filtered files", filtered.map(f => f.name));
        
        if (filtered.length === 0) {
            console.warn("No accepted files found for mode:", mode);
            alert(`選択されたファイルは現在のモード（${mode}）では使用できない形式です。`);
            return;
        }

        if (mode === 'ocr') {
            // OCRモードでもファイルをリストに追加し、ボタンで実行するように変更
            setIsProcessing(true);
            setIsCancelled(false);
            isCancelledRef.current = false;
            setProgress(0);
            
            const allMapped: any[] = [];
            try {
                for (let i = 0; i < filtered.length; i++) {
                    if (isCancelledRef.current) throw new Error("CANCELLED");
                    const file = filtered[i];
                    const lowerName = file.name.toLowerCase();
                    
                    if (lowerName.endsWith('.pdf')) {
                        const arrayBuffer = await file.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
                        for (let p = 1; p <= pdf.numPages; p++) {
                            const id = Math.random().toString(36).substr(2, 9);
                            const canvas = await renderPdfPageToCanvas(pdf, p, 0);
                            const preview = canvas.toDataURL('image/jpeg', 0.4);
                            allMapped.push({ id, file, preview, type: 'pdf', rotation: 0, pageNum: p, totalPage: pdf.numPages, originalName: file.name });
                        }
                    } else if (lowerName.endsWith('.svg')) {
                        const id = Math.random().toString(36).substr(2, 9);
                        const { canvas } = await getProcessedCanvas({ file, type: 'svg', rotation: 0 });
                        const preview = canvas.toDataURL('image/jpeg', 0.4);
                        allMapped.push({ id, file, preview, type: 'svg', rotation: 0 });
                    } else {
                        const id = Math.random().toString(36).substr(2, 9);
                        let preview = "";
                        if (lowerName.match(/\.(heic|heif)$/i)) {
                            const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
                            const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                            preview = URL.createObjectURL(blobToUse);
                        } else {
                            preview = URL.createObjectURL(file);
                        }
                        allMapped.push({ id, file, preview, type: 'image', rotation: 0 });
                    }
                    setProgress(Math.round(((i + 1) / filtered.length) * 100));
                }
                setFiles(prev => [...prev, ...allMapped]);
                showToast(`${filtered.length}個のファイルを追加しました`);
            } catch (err: any) {
                if (err.message !== "CANCELLED") {
                    console.error("Error adding files:", err);
                    alert("ファイルの読み込み中にエラーが発生しました。");
                }
            } finally {
                setIsProcessing(false);
                setProgress(0);
            }
            return;
        }

        setIsProcessing(true);
        setIsCancelled(false);
        isCancelledRef.current = false;
        setProgress(0);
        
        const allMapped: any[] = [];
        try {
            for (let i = 0; i < filtered.length; i++) {
                if (isCancelledRef.current) throw new Error("CANCELLED");
                const file = filtered[i];
                const lowerName = file.name.toLowerCase();
                console.log(`Processing file ${i+1}/${filtered.length}: ${file.name}`);
                
                if (lowerName.endsWith('.pdf') && mode === 'join') {
                    console.log("Loading PDF for joining...");
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
                    console.log(`PDF loaded successfully: ${pdf.numPages} pages`);
                    
                    for (let p = 1; p <= pdf.numPages; p++) {
                        if (isCancelledRef.current) throw new Error("CANCELLED");
                        const id = Math.random().toString(36).substr(2, 9);
                        const canvas = await renderPdfPageToCanvas(pdf, p, 0);
                        const preview = canvas.toDataURL('image/jpeg', 0.4);
                        allMapped.push({ 
                            id, 
                            file, 
                            preview, 
                            type: 'pdf', 
                            rotation: 0, 
                            pageNum: p, 
                            totalPage: pdf.numPages,
                            originalName: file.name
                        });
                        setProgress(Math.round(((i + (p / pdf.numPages)) / filtered.length) * 100));
                    }
                } else {
                    const id = Math.random().toString(36).substr(2, 9);
                    let processedFile = file;
                    let preview: string | null = null;
                    let type = 'unknown';

                    if (lowerName.endsWith('.svg')) {
                        type = 'svg';
                        preview = URL.createObjectURL(file);
                    } else if (lowerName.endsWith('.pdf')) {
                        type = 'pdf';
                        try {
                            console.log("Generating PDF preview...");
                            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
                            const canvas = await renderPdfPageToCanvas(pdf, 1, 0);
                            preview = canvas.toDataURL('image/jpeg', 0.4);
                            console.log("PDF preview generated");
                        } catch (err) {
                            console.error("PDF preview generation error:", err);
                        }
                    } else if (lowerName.match(/\.(jpg|jpeg|png)$/i)) {
                        type = 'image';
                        preview = URL.createObjectURL(file);
                    } else if (lowerName.match(/\.(heic|heif)$/i)) {
                        type = 'heic';
                        try {
                            const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
                            const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                            preview = URL.createObjectURL(blobToUse);
                            processedFile = new File([blobToUse], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
                        } catch (err) {
                            console.error("HEIC conversion error:", err);
                        }
                    }
                    allMapped.push({ id, file: processedFile, preview, type, rotation: 0, originalName: file.name });
                }
                setProgress(Math.round(((i + 1) / filtered.length) * 100));
            }

            console.log("Successfully mapped files:", allMapped.length);
            if (mode === 'split') {
                setFiles(allMapped);
            } else {
                setFiles(prev => [...prev, ...allMapped]);
            }
        } catch (err: any) {
            if (err.message === "CANCELLED") {
                showToast("処理を強制停止しました");
            } else {
                console.error("Critical error in addFiles:", err);
                alert("ファイルの処理中にエラーが発生しました。詳細はコンソールを確認してください。");
            }
        } finally {
            setIsProcessing(false);
            setIsCancelled(false);
            isCancelledRef.current = false;
            setProgress(0);
        }
    }, [mode, handleOCRFiles, showToast]);

    const getProcessedCanvas = async (item: any): Promise<{ canvas: HTMLCanvasElement, canvasWidth: number, canvasHeight: number }> => {
        if (item.type === 'pdf') {
            const canvas = await renderPdfToCanvas(item.file, item.pageNum || 1, item.rotation);
            return { canvas, canvasWidth: canvas.width, canvasHeight: canvas.height };
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error("Canvas context not found"));
                    let width = img.width || 800;
                    let height = img.height || 600;
                    
                    // SVGの場合は解像度を上げるためにスケールを大きくする
                    const isSvg = item.type === 'svg' || (item.file && item.file.name.toLowerCase().endsWith('.svg'));
                    const scaleFactor = isSvg ? 4 : 2;

                    const isVertical = item.rotation === 90 || item.rotation === 270;
                    const canvasWidth = isVertical ? height : width;
                    const canvasHeight = isVertical ? width : height;

                    canvas.width = canvasWidth * scaleFactor;
                    canvas.height = canvasHeight * scaleFactor;
                    ctx.scale(scaleFactor, scaleFactor);
                    ctx.translate(canvasWidth / 2, canvasHeight / 2);
                    ctx.rotate((item.rotation * Math.PI) / 180);
                    ctx.translate(-width / 2, -height / 2);
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve({ canvas, canvasWidth, canvasHeight });
                };
                img.onerror = () => reject(new Error("イメージの読み込みに失敗しました"));
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(item.file);
        });
    };

    const performDesignCheck = async (useRag: boolean = false) => {
        if (files.length === 0) return;
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) return;
            const ai = new GoogleGenAI({ apiKey });
            
            setStatusMessage(useRag ? "RAG知識データを取得しています..." : "図面チェックを実行中...");

            // GASからプロンプトとRAGデータを取得
            const ragData = useRag ? await fetchRagDataFromGas(setStatusMessage, isCancelledRef, setIsFetchingRag) : null;
            
            setStatusMessage("図面を解析用に変換しています...");
            const parts: any[] = [];
            const maxPages = 10; // 結合/分割時は代表して10ページまで
            let pageCount = 0;

            for (let fIdx = 0; fIdx < files.length && pageCount < maxPages; fIdx++) {
                if (isCancelledRef.current) throw new Error("CANCELLED");
                const item = files[fIdx];
                const { canvas } = await getProcessedCanvas(item);
                const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
                pageCount++;
            }

            let prompt = "";
            const fileName = files.length > 1 ? `${files[0].file.name} 他${files.length - 1}件` : files[0].file.name;
            const jsonStructure = useRag ? `{
  "局番号": "",
  "局名": "",
  "図面Rev": "",
  "既設": {
    "周波数": "",
    "セクタ数": "",
    "アンテナ": "",
    "RU": ""
  },
  "新設": {
    "周波数": "",
    "セクタ数": "",
    "アンテナ": "",
    "RU": ""
  },
  "認証型式": "",
  "機器名称": "",
  "DU_MU": "",
  "伝送装置": "",
  "WDM": "",
  "RAN判定": "",
  "図面種類判定": "",
  "図面整合チェック": {
    "局番号一致": "",
    "局名一致": "",
    "図番連番": "",
    "欠番": "",
    "重複": "",
    "目次一致": "",
    "詳細": ""
  },
  "凡例ルールチェック": {
    "凡例": "",
    "新設＝赤": "",
    "撤去＝青": "",
    "詳細": ""
  },
  "図面内容チェック": "",
  "仮設工事チェック": "",
  "根拠": "",
  "不明点": "",
  "信頼度": ""
}` : `{
  "局番号": "",
  "局名": "",
  "図面Rev": "",
  "図面種類判定": "",
  "図面整合チェック": {
    "局番号一致": "",
    "局名一致": "",
    "図番連番": "",
    "欠番": "",
    "重複": "",
    "目次一致": "",
    "詳細": ""
  },
  "凡例ルールチェック": {
    "凡例": "",
    "新設＝赤": "",
    "撤去＝青": "",
    "詳細": ""
  },
  "図面内容チェック": "",
  "仮設工事チェック": "",
  "根拠": "",
  "不明点": "",
  "信頼度": ""
}`;

            const markdownFormat = useRag ? `
# 設計チェック結果

## 概要
- 局番号：
- 局名：
- 図面Rev：
- RAN：

---

## 既設設備
- 周波数：
- セクタ数：
- アンテナ：
- RU：

---

## 新設設備
- 周波数：
- セクタ数：
- アンテナ：
- RU：

---

## 構成
- DU/MU：
- 伝送装置：
- WDM：

---

## 機器
- 機器名称：

---

## チェック項目
### ① 図面種類判定
- 

### ② 図面整合チェック
- 局番号一致：
- 局名一致：
- 図番連番：
- 欠番：
- 重複：
- 目次一致：
- 詳細：

### ③ 凡例ルールチェック
- 凡例：
- 新設＝赤：
- 撤去＝青：
- 詳細：

### ④ 図面内容チェック
- 

### ⑤ 仮設工事チェック
- 

---

## 根拠
-

---

## 不明点
-

---

## 信頼度
-
---

## OCR抽出データ
- 
` : `
# 設計チェック結果

## 概要
- 局番号：
- 局名：
- 図面Rev：

---

## チェック項目
### ① 図面種類判定
- 

### ② 図面整合チェック
- 局番号一致：
- 局名一致：
- 図番連番：
- 欠番：
- 重複：
- 目次一致：
- 詳細：

### ③ 凡例ルールチェック
- 凡例：
- 新設＝赤：
- 撤去＝青：
- 詳細：

### ④ 図面内容チェック
- 

### ⑤ 仮設工事チェック
- 

---

## 根拠
-

---

## 不明点
-

---

## 信頼度
-
---

## OCR抽出データ
- 
`;

            const outputInstruction = `
【出力形式（厳守）】
出力は以下の2部構成とし、その間を「---」で区切ること：

① Markdown（最初に出力）
② OCR抽出データ（「## OCR抽出データ」という見出しの後に、画像から読み取れる全てのテキストを詳細に抽出してください。表がある場合はMarkdown形式のテーブルとして出力し、図面内の全ての文字情報を網羅してください。要約は禁止です。全データを抽出してください。）

Markdownは人間可読用とする。
自然文・説明文・前置き・後置きは禁止。

Markdownの形式（固定）：
${markdownFormat}
`;

            if (useRag || isDesignCheckEnabled) {
                if (ragData && ragData.prompt) {
                    // GASから取得したプロンプトを使用
                    let knowledge = ragData.ragData || "データなし";
                    // 知識データが大きすぎる場合は切り詰める
                    if (knowledge.length > 30000) {
                        knowledge = knowledge.substring(0, 30000) + "...(データ過多のため省略)";
                    }

                    prompt = `【RAG解析結果】
以下は事前に取得された図面情報である。
この情報を優先参照すること。

${knowledge}

---

【解析指示】
上記のRAG解析結果および入力PDFを基に、以下のチェックを実行する。

① 図面種類判定
② 図面整合チェック（局番号・局名の一致、図番の連番・欠番・重複、目次との整合性）
③ 凡例ルールチェック（凡例の有無、新設＝赤・撤去＝青のルール遵守）
④ 図面内容チェック
⑤ 仮設工事チェック

${outputInstruction}

---

【制約】
・RAG情報を優先して判断すること
・RAG未記載事項のみPDFから補完すること
・推測禁止
・一部ページのみで判断禁止
・最初の検出で処理終了禁止
・キー名は変更禁止
・キーの欠落禁止（不明な場合は「不明」と記載）
・配列ではなく文字列で返す
・改行や装飾は禁止

${designCheckCustomPrompt ? `【追加指示】\n${designCheckCustomPrompt}\n` : ""}

【対象ファイル】
${fileName}`;
                } else {
                    // 標準の設計チェックプロンプト
                    prompt = `あなたは通信基地局の設計図面をチェックする専門家です。
画像から情報を読み取り、以下の項目についてチェックを行ってください。

【チェック項目】
① 図面種類判定：図面の種類（系統図、配置図、平面図など）を判定してください。
② 図面整合チェック：局番号・局名の一致、図番の連番・欠番・重複、目次との整合性を確認してください。
③ 凡例ルールチェック：凡例の有無、および「新設＝赤」「撤去＝青」のルールが守られているか確認してください。
④ 図面内容チェック：必要な設備情報が正しく記載されているか確認してください。
⑤ 仮設工事チェック：仮設工事に関する記述がある場合、その内容を確認してください。

${outputInstruction}

---

【制約】
・推測禁止
・一部ページのみで判断禁止
・最初の検出で処理終了禁止
・キー名は変更禁止
・キーの欠落禁止（不明な場合は「不明」と記載）
・配列ではなく文字列で返す
・改行や装飾は禁止
・画像から読み取れない項目は「不明」と記載してください。
・推測はせず、事実のみを抽出してください。
・出力は日本語でお願いします。

${designCheckCustomPrompt ? `【追加指示】\n${designCheckCustomPrompt}\n` : ""}

【対象ファイル】
${fileName}`;
                }
            }

            setStatusMessage("Gemini AIが解析中...");
            const response = await ai.models.generateContent({
<<<<<<< HEAD
                model: "gemini-3-flash-preview",
                contents: { parts: [{ text: prompt }, ...parts] },
                config: {
                    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
=======
                model: selectedModel,
                contents: { parts: [{ text: prompt }, ...parts] },
                config: {
                    thinkingConfig: { 
                        thinkingLevel: selectedModel.includes('pro') ? ThinkingLevel.HIGH : ThinkingLevel.LOW 
                    }
>>>>>>> ec41c49 (feat: 設計チェック、AI解析を個別に出力変更)
                }
            });

            if (isCancelledRef.current) throw new Error("CANCELLED");

            setProgress(100);
            setStatusMessage("解析完了");
            const text = response.text || "";
            
            // 解析結果の振り分け
            const ocrMarkers = ["## OCR抽出データ", "### OCR抽出データ", "OCR抽出データ:", "【OCR抽出データ】"];
            let foundMarker = "";
            for (const marker of ocrMarkers) {
                if (text.includes(marker)) {
                    foundMarker = marker;
                    break;
                }
            }

            if (foundMarker) {
                const parts = text.split(foundMarker);
                const mainResult = parts[0].trim();
                const ocrPart = parts[1].trim();
                
                setDesignCheckResult(mainResult);
                setOcrResult(ocrPart);
                setTimeout(() => {
                    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                if (useRag || isDesignCheckEnabled) {
                    setDesignCheckResult(text);
                    setTimeout(() => {
                        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                } else {
                    setOcrResult(text);
                    setDesignCheckResult("");
                }
            }
        } catch (err: any) {
            console.error("Design Check Error:", err);
            setStatusMessage("エラーが発生しました");
            if (err.message === "CANCELLED") throw err;
        }
    };

    const handleJoinProcess = async (explicitUseRag?: boolean) => {
        const useRag = explicitUseRag !== undefined ? explicitUseRag : isRagEnabled;
        console.log("handleJoinProcess started", { filesCount: files.length, outFormat, useRag });
        if (isProcessing || files.length === 0) {
            console.warn("No files to process or already processing");
            return;
        }
        setIsProcessing(true);
        setOcrResult('');
        setDesignCheckResult('');
        setIsCancelled(false);
        isCancelledRef.current = false;
        setProgress(0);
        setStatusMessage(useRag ? "RAG解析を実行中..." : "図面を結合しています...");
        const timestamp = Date.now();
        try {
            // 設計チェックが有効な場合、またはRAG解析が指定された場合
            if (isDesignCheckEnabled || useRag) {
                await performDesignCheck(useRag);
            }

            if (outFormat === 'pdf') {
                const mergedPdf = await PDFDocument.create();
                for (let i = 0; i < files.length; i++) {
                    if (isCancelledRef.current) throw new Error("CANCELLED");
                    const item = files[i];
                    console.log(`Processing item ${i}:`, item.type, item.file?.name);
                    if (item.type === 'svg' || item.type === 'heic' || item.type === 'image' || (item.file && item.file.type.startsWith('image/'))) {
                        const { canvas, canvasWidth, canvasHeight } = await getProcessedCanvas(item);
                        const imgData = canvas.toDataURL('image/jpeg', 0.9);
                        const singlePdf = new jsPDF({
                            orientation: canvasWidth > canvasHeight ? 'l' : 'p',
                            unit: 'pt',
                            format: [canvasWidth, canvasHeight]
                        });
                        singlePdf.addImage(imgData, 'JPEG', 0, 0, canvasWidth, canvasHeight);
                        const donor = await PDFDocument.load(new Uint8Array(singlePdf.output('arraybuffer')));
                        const pages = await mergedPdf.copyPages(donor, donor.getPageIndices());
                        pages.forEach(p => mergedPdf.addPage(p));
                    } else if (item.type === 'pdf') {
                        const donor = await PDFDocument.load(new Uint8Array(await item.file.arrayBuffer()));
                        const pageIndex = item.pageNum ? [item.pageNum - 1] : donor.getPageIndices();
                        const pages = await mergedPdf.copyPages(donor, pageIndex);
                        pages.forEach(page => {
                            if (item.rotation !== 0) {
                                page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360));
                            }
                            mergedPdf.addPage(page);
                        });
                    } else {
                        console.warn(`Unknown item type at index ${i}:`, item.type);
                    }
                    setProgress(Math.round(((i + 1) / files.length) * 100));
                    await new Promise(r => setTimeout(r, 100)); 
                }
                const pdfBytes = await mergedPdf.save();
                const fileName = `ダチョウの卵_${timestamp}.pdf`;
                const url = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
                addHistoryItem(fileName, url, files.length, 'JOIN');
                download(url, fileName);
                
                console.log("PDF merge successful");
            } else {
                let totalSteps = 0;
                for (const item of files) {
                    if (item.type === 'pdf' && item.file) {
                        const pdf = await pdfjsLib.getDocument(await item.file.arrayBuffer()).promise;
                        totalSteps += pdf.numPages;
                    } else {
                        totalSteps += 1;
                    }
                }

                const zip = new JSZip();
                let currentStep = 0;
                for (let i = 0; i < files.length; i++) {
                    if (isCancelledRef.current) throw new Error("CANCELLED");
                    const item = files[i];
                    const mime = outFormat === 'png' ? 'image/png' : 'image/jpeg';
                    const ext = outFormat;

                    if (item.type === 'pdf') {
                        const pdf = await pdfjsLib.getDocument(await item.file.arrayBuffer()).promise;
                        for (let p = 1; p <= pdf.numPages; p++) {
                            if (isCancelledRef.current) throw new Error("CANCELLED");
                            const canvas = await renderPdfToCanvas(item.file, p, item.rotation);
                            const fileName = `ダチョウの卵_${item.file.name.split('.')[0]}_p${p}.${ext}`;
                            const dataUrl = canvas.toDataURL(mime, 0.95);
                            const base64Data = dataUrl.split(',')[1];
                            zip.file(fileName, base64Data, { base64: true });
                            currentStep++;
                            setProgress(Math.round((currentStep / totalSteps) * 100));
                            await new Promise(r => setTimeout(r, 100));
                        }
                    } else {
                        const { canvas } = await getProcessedCanvas(item);
                        const fileName = `ダチョウの卵_${item.file.name.split('.')[0]}.${ext}`;
                        const dataUrl = canvas.toDataURL(mime, 0.95);
                        const base64Data = dataUrl.split(',')[1];
                        zip.file(fileName, base64Data, { base64: true });
                        currentStep++;
                        setProgress(Math.round((currentStep / totalSteps) * 100));
                        await new Promise(r => setTimeout(r, 100));
                    }
                }
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const zipUrl = URL.createObjectURL(zipBlob);
                const zipName = `ダチョウの卵_変換一括_${timestamp}.zip`;
                download(zipUrl, zipName);
                addHistoryItem(zipName, zipUrl, totalSteps, 'CONVERT');
            }
            setFiles([]);
            triggerEggAnimation();
            showToast("処理が完了しました");
            if (isDesignCheckEnabled) notifyCompletion();
        } catch (e: any) {
            if (e.message === "CANCELLED") {
                showToast("処理を強制停止しました");
            } else {
                console.error("Join Process Error:", e);
                alert("エラーが発生しました: " + e.message);
            }
        } finally {
            setIsProcessing(false);
            setIsCancelled(false);
            isCancelledRef.current = false;
            setStatusMessage("");
            setProgress(0);
        }
    };

    const processSplit = async () => {
        if (isProcessing || files.length === 0) return;
        setIsProcessing(true);
        setIsCancelled(false);
        isCancelledRef.current = false;
        setProgress(0);
        setStatusMessage("PDFを分割しています...");
        const timestamp = Date.now();
        try {
            if (isDesignCheckEnabled || isRagEnabled) {
                await performDesignCheck(isRagEnabled);
            }
            const file = files[0].file;
            const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
            const pageCount = pdfDoc.getPageCount();
            const zip = new JSZip();
            for (let i = 0; i < pageCount; i++) {
                if (isCancelledRef.current) throw new Error("CANCELLED");
                const newPdf = await PDFDocument.create();
                const [page] = await newPdf.copyPages(pdfDoc, [i]);
                newPdf.addPage(page);
                const pdfBytes = await newPdf.save();
                const fileName = `分割_${i+1}.pdf`;
                zip.file(fileName, pdfBytes);
                setProgress(Math.round(((i + 1) / pageCount) * 100));
                await new Promise(r => setTimeout(r, 50));
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);
            const zipName = `ダチョウの卵_分割_${file.name.split('.')[0]}_${timestamp}.zip`;
            download(zipUrl, zipName);
            addHistoryItem(zipName, zipUrl, pageCount, 'SPLIT');

            setFiles([]);
            triggerEggAnimation();
            if (isDesignCheckEnabled) notifyCompletion();
        } catch (e: any) { 
            if (e.message === "CANCELLED") {
                showToast("処理を強制停止しました");
            } else {
                alert(e.message); 
            }
        } finally {
            setIsProcessing(false);
            setIsCancelled(false);
            isCancelledRef.current = false;
            setStatusMessage("");
            setProgress(0);
        }
    };

    const download = (url: string, name: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);
    };

    const resultRef = useRef<HTMLDivElement>(null);
    const ocrResultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if ((ocrResult || designCheckResult) && !isProcessing) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [ocrResult, designCheckResult, isProcessing]);

    const getProcessedOcrText = () => {
        if (ocrWidthMode === 'full') {
            return ocrResult.replace(/[!-~]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0)).replace(/ /g, "\u3000");
        }
        if (ocrWidthMode === 'half') {
            return ocrResult.replace(/[\uff01-\uff5e]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/\u3000/g, " ");
        }
        return ocrResult;
    };

    const processedOcrText = getProcessedOcrText();

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 relative">
            <AnimatePresence>
                {toastVisible && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="toast show"
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {isProcessing && (
                <div className="fixed top-0 left-0 w-full z-[200] pointer-events-none">
                    <div className="bg-indigo-100 h-3 w-full overflow-hidden shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.6)] relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </motion.div>
                    </div>
                    {statusMessage && (
                        <div className="flex justify-center mt-2">
                            <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg border border-slate-200 flex items-center gap-2 animate-bounce-subtle">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{statusMessage} ({progress}%)</span>
                                {isFetchingRag && (
                                    <button 
                                        onClick={() => {
                                            isCancelledRef.current = true;
                                            setIsCancelled(true);
                                        }}
                                        className="ml-2 px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-md text-[8px] font-black uppercase tracking-wider border border-rose-200 transition-colors pointer-events-auto"
                                    >
                                        Skip
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isProcessing && (
                <div className="fixed bottom-10 right-10 z-[120] flex flex-col items-center gap-4">
                    <div className={`bg-[#0a0a0a] p-1 rounded-xl border-2 border-[#222] shadow-[0_0_40px_-12px_rgba(255,0,0,0.4)] flex flex-col items-center overflow-hidden ring-1 ring-[#333] ${!animationsEnabled ? 'no-animation' : ''}`}>
                        {/* Top Banner - Smaller */}
                        <div className="w-full bg-[#ffcc00] text-black text-[7px] font-black py-1 px-4 flex justify-between items-center border-b-2 border-black">
                            <span className="animate-pulse">!</span>
                            <span className="tracking-[0.2em] font-black uppercase">Operation Cancel</span>
                            <span className="animate-pulse">!</span>
                        </div>
                        
                        <div className="p-4 flex flex-col items-center gap-4 bg-[#111] bg-[radial-gradient(circle_at_center,rgba(153,0,0,0.05)_0%,transparent_70%)]">
                            {/* Hexagonal Button Container - Smaller */}
                            <div className="relative group">
                                {/* Outer Frame Glow */}
                                <div className="absolute -inset-2 bg-rose-600/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <button 
                                    onClick={() => {
                                        if (isCancelled) return;
                                        isCancelledRef.current = true;
                                        setIsCancelled(true);
                                        // UIを即座にリセット
                                        setIsProcessing(false);
                                        setProgress(0);
                                        setStatusMessage("");
                                        showToast("停止リクエストを受け付けました");
                                    }}
                                    disabled={isCancelled}
                                    className={`w-28 h-24 bg-[#330000] relative flex items-center justify-center transition-all active:scale-95 active:translate-y-1 shadow-[0_6px_0_0_#1a0000] hover:shadow-[0_3px_0_0_#1a0000] hover:translate-y-0.5 ${isCancelled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                    style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                                >
                                    <div className={`absolute inset-1.5 ${isCancelled ? 'bg-[#444]' : 'bg-[#770000] animate-pulse-red'} flex flex-col items-center justify-center border border-rose-400/20`} style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}>
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_60%)]"></div>
                                        
                                        {/* Ostrich Face Schematic - Smaller */}
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
                                            <svg width="40" height="40" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="60" cy="60" r="55" fill="none" stroke="#fff" strokeWidth="0.5" strokeDasharray="4 4" />
                                                <g transform="translate(10, 20) scale(0.8)">
                                                    <path d="M40 100 C50 60, 45 20, 65 25" strokeWidth="8" fill="none" stroke="#fff" strokeLinecap="round" />
                                                    <circle cx="65" cy="25" r="10" fill="none" stroke="#fff" strokeWidth="2" />
                                                    <path d="M72 25 L95 28 L72 32 Z" fill="none" stroke="#fff" strokeWidth="2" />
                                                </g>
                                            </svg>
                                        </div>

                                        <span className="text-white text-2xl font-black tracking-tighter mb-0.5 select-none drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] z-10" style={{ fontFamily: '"Sawarabi Gothic", sans-serif' }}>
                                            {isCancelled ? '停止中' : '停止'}
                                        </span>
                                        <span className="text-white/30 text-[7px] font-black tracking-[0.3em] select-none uppercase z-10">Unit-01</span>
                                    </div>
                                    {/* Glass Shine */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none"></div>
                                </button>
                            </div>

                            {/* Bottom Industrial Label - Smaller */}
                            <div className="bg-[#000] border border-[#222] p-2 rounded-lg w-full shadow-inner">
                                <div className="flex justify-between items-center mb-1 px-1">
                                    <div className="w-1 h-1 rounded-full bg-rose-600/50"></div>
                                    <div className="text-[#555] text-[7px] font-black uppercase tracking-tighter">Safety Override System</div>
                                    <div className="w-1 h-1 rounded-full bg-rose-600/50"></div>
                                </div>
                                <div className="text-[#444] text-[7px] font-black leading-tight uppercase tracking-widest text-center border-t border-[#111] pt-1">
                                    Emergency / Manual Reset
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <Ostrich isActive={isProcessing} isLaying={isLayingEgg} isSearching={isDraggingOver} enabled={ostrichEnabled} animationsEnabled={animationsEnabled} />
            <OstrichEggButton onClick={() => setShowManual(true)} />
            <ManualModal isOpen={showManual} onClose={() => setShowManual(false)} />
            <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} onSubmit={handleFeedbackSubmit} />

            <header className="text-center mb-12">
                <div className="flex flex-col items-center gap-4 mb-10">
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">AI Model</span>
                            <select 
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="text-[11px] font-black text-indigo-600 bg-transparent outline-none cursor-pointer"
                            >
                                <option value="gemini-3-flash-preview">Gemini 3 Flash (高速)</option>
                                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (高精度)</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ostrich</span>
                            <button 
                                onClick={() => setOstrichEnabled(!ostrichEnabled)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${ostrichEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${ostrichEnabled ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Anime</span>
                            <button 
                                onClick={() => setAnimationsEnabled(!animationsEnabled)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${animationsEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${animationsEnabled ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">AI RAG解析</span>
                            <button 
                                onClick={() => setIsRagEnabled(!isRagEnabled)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${isRagEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isRagEnabled ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">設計チェック</span>
                            <button 
                                onClick={() => setIsDesignCheckEnabled(!isDesignCheckEnabled)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${isDesignCheckEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDesignCheckEnabled ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                            <span className="text-indigo-700 text-[11px] font-black uppercase tracking-[0.2em]">BETA PHASE</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setShowFeedback(true)} className="bg-white hover:bg-slate-50 text-amber-600 border border-amber-100 p-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 text-xs font-bold">
                                <MessageSquare className="w-4 h-4" /> 要望
                            </button>
                            <button onClick={() => setShowGuide(!showGuide)} className="bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 p-2.5 rounded-xl shadow-sm">
                                <HelpCircle className="w-4 h-4" />
                            </button>
                        </div>
                        
                        {/* Primary Action Button moved to header */}
                        <div className="ml-4">
                            <button 
                                onClick={() => {
                                    if (mode === 'ocr') handleOCRFiles();
                                    else if (mode === 'join') handleJoinProcess();
                                    else if (mode === 'split') processSplit();
                                }}
                                disabled={isProcessing || files.length === 0}
                                className={`px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${
                                    isProcessing 
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                                    : files.length === 0 
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-200'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        {progress}% 処理中
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3.5 h-3.5" />
                                        {mode === 'ocr' ? "解析実行" : mode === 'join' ? "生成開始" : "分割実行"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {showGuide && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="guide-bubble max-w-sm p-4 rounded-2xl shadow-lg text-left"
                        >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b pb-1">Tester's Guide</p>
                            <ul className="text-xs text-slate-600 space-y-2 font-bold">
                                <li>・SVG, PDF, HEIC, JPEG, PNG に対応</li>
                                <li>・複数の画像を1つのPDFに結合できます</li>
                                <li>・ドラッグして並び順を変更可能</li>
                                <li>・OCRモードで画像から文字起こしが可能</li>
                            </ul>
                        </motion.div>
                    )}
                </div>

                <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter">SVG & PDF <span className="text-indigo-600">Pro</span></h1>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Multi-Format Egg Hatchery</p>
                
                <div className="flex justify-center mt-12 space-x-12 border-b border-slate-200">
                    <button onClick={() => { setMode('join'); setFiles([]); setOcrPreviewUrl(null); }} className={`pb-5 px-6 text-sm font-black flex items-center gap-2.5 transition-all ${mode === 'join' ? 'tab-active' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Plus className="w-5 h-5" /> 結合・変換
                    </button>
                    <button onClick={() => { setMode('split'); setFiles([]); setOcrPreviewUrl(null); }} className={`pb-5 px-6 text-sm font-black flex items-center gap-2.5 transition-all ${mode === 'split' ? 'tab-active' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Scissors className="w-5 h-5" /> PDF分割
                    </button>
                    <button onClick={() => { setMode('ocr'); setFiles([]); setOcrResult(''); setOcrPreviewUrl(null); }} className={`pb-5 px-6 text-sm font-black flex items-center gap-2.5 transition-all ${mode === 'ocr' ? 'tab-active' : 'text-slate-400 hover:text-slate-600'}`}>
                        <FileText className="w-5 h-5" /> OCR (文字起こし)
                    </button>
                </div>
            </header>

            <div className={`grid ${(isDesignCheckEnabled || isRagEnabled) ? 'grid-cols-1 lg:grid-cols-[1fr_350px]' : 'grid-cols-1'} gap-8 mb-20 items-start`}>
                <div className="space-y-8">
                    <div 
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
                        onDrop={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            setIsDraggingOver(false); 
                            if (isProcessing) return;
                            console.log("Files dropped", e.dataTransfer.files.length);
                            addFiles(e.dataTransfer.files); 
                        }}
                        onClick={() => {
                            console.log("Drop zone clicked", { isProcessing });
                            if (!isProcessing) fileInputRef.current?.click();
                        }}
                        className={`group relative border-4 border-dashed rounded-[3rem] p-16 text-center transition-all cursor-pointer overflow-hidden ${isDraggingOver ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-slate-200 bg-white hover:border-indigo-300 shadow-xl shadow-slate-200/20'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <input 
                            type="file" 
                            multiple={mode === 'join' || mode === 'ocr'} 
                            accept={mode === 'join' ? ".svg,.pdf,.heic,.heif,.jpg,.jpeg,.png" : (mode === 'ocr' ? ".jpg,.jpeg,.png,.heic,.heif,.pdf,.svg" : ".pdf")} 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={(e) => {
                                console.log("File input changed", e.target.files?.length);
                                addFiles(e.target.files);
                                e.target.value = ''; // Reset to allow same file selection
                            }} 
                        />
                        <div className="relative z-10">
                            {/* Drag Over Processing Indicators */}
                            <AnimatePresence>
                                {isDraggingOver && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute inset-0 -top-24 flex justify-center items-center gap-6 pointer-events-none"
                                    >
                                        {[
                                            { id: 'join', label: '結合', icon: <Plus className="w-5 h-5" />, color: 'bg-emerald-500' },
                                            { id: 'split', label: 'PDF分割', icon: <Scissors className="w-5 h-5" />, color: 'bg-amber-500' },
                                            { id: 'ocr', label: 'OCR', icon: <FileText className="w-5 h-5" />, color: 'bg-indigo-500' }
                                        ].map((item, i) => {
                                            const isActive = mode === item.id;
                                            return (
                                                <div key={i} className={`flex flex-col items-center gap-3 transition-all duration-300 ${isActive ? 'scale-110 opacity-100' : 'scale-90 opacity-20 grayscale'}`}>
                                                    <div className={`w-20 h-20 rounded-3xl ${item.color} shadow-[0_0_30px_rgba(0,0,0,0.2)] flex items-center justify-center text-white ring-4 ring-white ${isActive ? 'animate-bounce' : ''}`} style={{ animationDelay: `${i * 0.15}s` }}>
                                                        {item.icon}
                                                    </div>
                                                    <span className={`font-black text-sm tracking-widest px-4 py-1 rounded-full shadow-lg border-2 border-white text-white ${item.color}`}>{item.label}</span>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {mode === 'ocr' && ocrPreviewUrl ? (
                                <div className="flex flex-col items-center">
                                    <div className="relative w-48 h-48 mb-6 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                                        <img src={ocrPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        {isProcessing && (
                                            <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center">
                                                <RefreshCw className="w-10 h-10 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xl font-black text-slate-800 mb-1 tracking-tight">
                                        {isProcessing ? "画像を解析中..." : "解析完了"}
                                    </p>
                                    <p className="text-slate-400 text-sm font-bold italic">
                                        {isProcessing ? "少々お待ちください" : "別の画像をドロップして再試行"}
                                    </p>
                                </div>
                            ) : files.length > 0 ? (
                                <div className="flex flex-col items-center">
                                    <div className="flex -space-x-8 mb-8">
                                        {files.slice(0, 3).map((f, idx) => (
                                            <div 
                                                key={f.id} 
                                                className="w-24 h-24 bg-white border-4 border-white rounded-2xl shadow-xl overflow-hidden transform"
                                                style={{ 
                                                    transform: `rotate(${(idx - 1) * 10}deg) translateY(${Math.abs(idx - 1) * 10}px)`,
                                                    zIndex: 3 - idx
                                                }}
                                            >
                                                {f.preview ? (
                                                    <img src={f.preview} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                                                        <FileText className="w-8 h-8 text-indigo-400" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {files.length > 3 && (
                                            <div className="w-24 h-24 bg-slate-100 border-4 border-white rounded-2xl shadow-xl flex items-center justify-center transform rotate-[15deg] z-0">
                                                <span className="text-slate-400 font-black">+{files.length - 3}</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                                        {files.length}個のファイルが待機中
                                    </h3>
                                    <p className="text-slate-400 font-bold">
                                        さらに追加するにはドロップまたはクリック
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-24 h-24 bg-indigo-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                                        {mode === 'join' ? <Upload className="w-12 h-12 text-indigo-600" /> : (mode === 'ocr' ? <FileText className="w-12 h-12 text-indigo-600" /> : <Scissors className="w-12 h-12 text-indigo-600" />)}
                                    </div>
                                    <p className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
                                        {mode === 'ocr' ? "画像をドロップ or 貼り付け" : "ファイルをドロップ"}
                                    </p>
                                    <p className="text-slate-400 text-base font-bold italic">
                                        {mode === 'ocr' ? "スクリーンショットのコピペ(Ctrl+V)にも対応" : "SVG, PDF, HEIC, JPG, PNG に対応しています"}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {/* AIRAG解析結果 / 設計チェック結果 */}
                        {(isRagEnabled || isDesignCheckEnabled) && designCheckResult && (
                            <motion.div 
                                key="analysis-result"
                                ref={resultRef}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mt-10 bg-emerald-50 border border-emerald-100 rounded-[3rem] p-10 shadow-inner"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-sm">
                                            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                                {isRagEnabled ? "AIRAG解析結果" : "設計チェック結果"}
                                            </h3>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                {isRagEnabled ? "AI RAG Analysis Report" : "Design Review Report"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setIsEditingResult(!isEditingResult)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${isEditingResult ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            {isEditingResult ? <><CheckCircle2 className="w-3.5 h-3.5" /> 完了</> : <><Edit3 className="w-3.5 h-3.5" /> 編集 (Canvas)</>}
                                        </button>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(designCheckResult);
                                                showToast("レポートをコピーしました");
                                            }}
                                            className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-200 transition-all flex items-center gap-2"
                                        >
                                            <Copy className="w-3.5 h-3.5" /> コピー
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setDesignCheckResult('');
                                                setIsEditingResult(false);
                                            }}
                                            className="p-3 hover:bg-emerald-100 rounded-full transition-colors"
                                        >
                                            <X className="w-6 h-6 text-emerald-400" />
                                        </button>
                                    </div>
                                </div>
                                <div className={`relative transition-all duration-500 ${isEditingResult ? 'bg-slate-50 rounded-[2rem] p-1' : ''}`}>
                                    {isEditingResult ? (
                                        <div className="relative min-h-[500px] w-full bg-white rounded-[1.8rem] border-2 border-indigo-100 shadow-inner overflow-hidden">
                                            {/* Canvas Grid Background */}
                                            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                            
                                            <textarea 
                                                ref={resultTextareaRef}
                                                value={designCheckResult}
                                                onChange={(e) => setDesignCheckResult(e.target.value)}
                                                placeholder="ここに内容を自由に記述・編集できます..."
                                                className="relative z-10 w-full min-h-[500px] p-10 bg-transparent outline-none font-mono text-sm leading-relaxed text-slate-700 resize-none"
                                            />
                                            
                                            <div className="absolute bottom-6 right-8 z-20 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Canvas Mode Active</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="prose prose-slate max-w-none markdown-body bg-white p-10 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden group">
                                            <div className="markdown-body relative z-10">
                                                {(() => {
                                                    const markdownPart = designCheckResult;

                                                    return (
                                                        <div className="space-y-10">
                                                            {/* Markdown View (Primary) */}
                                                            <div 
                                                                className="markdown-body"
                                                                dangerouslySetInnerHTML={{ __html: marked.parse(markdownPart) as string }}
                                                            />
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <button 
                                                    onClick={() => setIsEditingResult(true)} 
                                                    className="bg-white/80 backdrop-blur-sm border border-emerald-200 p-3 rounded-2xl text-emerald-600 hover:bg-emerald-50 hover:scale-110 shadow-lg shadow-emerald-100/50 transition-all"
                                                    title="編集 (Canvas)"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* OCR抽出結果 */}
                        {ocrResult && (
                            <motion.div 
                                key="ocr-result"
                                ref={ocrResultRef}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`mt-10 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl ${(isRagEnabled || isDesignCheckEnabled) ? 'opacity-90 scale-95' : ''}`}
                            >
                                {(isRagEnabled || isDesignCheckEnabled) ? (
                                    <details className="group" open={false}>
                                        <summary className="flex items-center justify-between cursor-pointer list-none">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-open:rotate-90 transition-transform">
                                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                                </div>
                                                <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-[0.3em]">
                                                    <FileText className="w-5 h-5 text-indigo-500" />
                                                    OCR Result (抽出全データ)
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-open:hidden">クリックで全データを展開</span>
                                                <div className="flex bg-slate-100 p-1 rounded-xl" onClick={(e) => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => setOcrWidthMode('original')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'original' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        原文
                                                    </button>
                                                    <button 
                                                        onClick={() => setOcrWidthMode('full')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'full' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        全角
                                                    </button>
                                                    <button 
                                                        onClick={() => setOcrWidthMode('half')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'half' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        半角
                                                    </button>
                                                </div>
                                            </div>
                                        </summary>
                                        <div className="mt-8 pt-8 border-t border-slate-50">
                                            <div className="flex justify-end mb-4">
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(processedOcrText);
                                                        showToast("クリップボードにコピーしました");
                                                    }}
                                                    className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-all flex items-center gap-2"
                                                >
                                                    <Copy className="w-3.5 h-3.5" /> コピー
                                                </button>
                                            </div>
                                            <div 
                                                className="prose prose-slate max-w-none text-sm font-medium leading-relaxed bg-slate-50 p-8 rounded-2xl border border-slate-100 overflow-x-auto"
                                                dangerouslySetInnerHTML={{ __html: marked.parse(processedOcrText) as string }}
                                            />
                                        </div>
                                    </details>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                                            <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-[0.3em]">
                                                <FileText className="w-5 h-5 text-indigo-500" />
                                                OCR Result (抽出結果)
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                                    <button 
                                                        onClick={() => setOcrWidthMode('original')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'original' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        原文
                                                    </button>
                                                    <button 
                                                        onClick={() => setOcrWidthMode('full')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'full' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        全角
                                                    </button>
                                                    <button 
                                                        onClick={() => setOcrWidthMode('half')}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${ocrWidthMode === 'half' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        半角
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(processedOcrText);
                                                        showToast("クリップボードにコピーしました");
                                                    }}
                                                    className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-all flex items-center gap-2"
                                                >
                                                    <Copy className="w-3.5 h-3.5" /> コピー
                                                </button>
                                                <button 
                                                    onClick={() => setOcrResult('')}
                                                    className="p-3 hover:bg-slate-100 rounded-full transition-colors"
                                                >
                                                    <X className="w-6 h-6 text-slate-400" />
                                                </button>
                                            </div>
                                        </div>
                                        <div 
                                            className="prose prose-slate max-w-none text-sm font-medium leading-relaxed bg-slate-50 p-8 rounded-2xl border border-slate-100 overflow-x-auto"
                                            dangerouslySetInnerHTML={{ __html: marked.parse(processedOcrText) as string }}
                                        />
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {files.length > 0 && (
                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-300/40 border border-slate-100 overflow-hidden animate-slide">
                            <div className="px-10 py-6 bg-slate-50 border-b flex flex-wrap justify-between items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-600 text-white p-2 rounded-xl">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <span className="font-black text-slate-800 text-sm uppercase tracking-widest">
                                        Waitlist ({files.length})
                                    </span>
                                    {files.length > 0 && !isProcessing && (
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log("Clear All button clicked");
                                                setFiles([]);
                                                showToast("リストを空にしました");
                                            }}
                                            className="ml-2 text-[10px] font-black text-rose-500 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl transition-all uppercase tracking-widest border border-rose-100"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    {mode === 'join' && (
                                        <select 
                                            value={outFormat} 
                                            onChange={(e) => setOutFormat(e.target.value)}
                                            className="bg-white border border-slate-200 text-xs font-black rounded-2xl px-5 py-3 outline-none shadow-sm cursor-pointer"
                                        >
                                            <option value="pdf">Output: PDFに結合</option>
                                            <option value="png">Output: 1枚ずつPNGに</option>
                                            <option value="jpeg">Output: 1枚ずつJPEGに</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-[600px] overflow-y-auto">
                                <Reorder.Group 
                                    axis="y" 
                                    values={files} 
                                    onReorder={(newOrder) => {
                                        console.log("Reordered files", newOrder.length);
                                        setFiles(newOrder);
                                    }} 
                                    className="list-none p-0 m-0"
                                >
                                    <AnimatePresence mode="popLayout">
                                        {files.map((item) => (
                                            <Reorder.Item 
                                                key={item.id} 
                                                value={item}
                                                as="li"
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className={`p-6 flex items-center gap-8 hover:bg-indigo-50/20 transition-colors border-b border-slate-50 last:border-0 bg-white ${mode === 'join' && !isProcessing ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                            >
                                                {mode === 'join' && (
                                                    <div className="text-slate-300 hover:text-indigo-400 transition-colors shrink-0">
                                                        <GripVertical className="w-6 h-6" />
                                                    </div>
                                                )}
                                                <div className="w-20 h-20 bg-white border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-md relative">
                                                    <div className="rotate-preview w-full h-full flex items-center justify-center" style={{ transform: `rotate(${item.rotation}deg)` }}>
                                                        {item.preview ? <img src={item.preview} className="object-contain w-full h-full p-2" referrerPolicy="no-referrer" /> : <FileText className="text-indigo-400 w-8 h-8" />}
                                                    </div>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-black text-slate-800 text-lg break-all">
                                                        {item.file?.name || 'Unknown File'}
                                                        {item.pageNum && <span className="ml-2 text-indigo-500">p.{item.pageNum}</span>}
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase">{item.type}</span>
                                                        {item.rotation !== 0 && <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase">{item.rotation}° </span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!isProcessing && (
                                                        <button onClick={() => rotateItem(item.id)} className="text-slate-400 hover:text-indigo-600 p-3 hover:bg-white rounded-2xl transition-all">
                                                            <RefreshCw className="w-6 h-6" />
                                                        </button>
                                                    )}
                                                    {!isProcessing && (
                                                        <button onClick={() => setFiles(files.filter(f => f.id !== item.id))} className="text-slate-300 hover:text-rose-500 p-3 hover:bg-white rounded-2xl transition-all">
                                                            <X className="w-6 h-6" />
                                                        </button>
                                                    )}
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </AnimatePresence>
                                </Reorder.Group>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/30">
                        <h3 className="font-black text-slate-400 flex items-center gap-3 mb-8 uppercase text-xs tracking-[0.3em]">
                            <History className="w-5 h-5 text-indigo-500" />
                            Sessions
                        </h3>
                        {history.length === 0 ? (
                            <div className="py-16 text-center">
                                <p className="text-slate-300 text-sm font-bold italic">履歴はありません</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {history.map(item => (
                                    <div key={item.id} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 animate-slide hover:border-indigo-200 transition-colors group">
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <p className="text-xs font-black text-slate-800 truncate flex-grow break-all" title={item.name}>{item.name}</p>
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg shrink-0 ${item.action === 'JOIN' ? 'bg-indigo-100 text-indigo-600' : item.action === 'CONVERT' ? 'bg-emerald-100 text-emerald-600' : item.action === 'OCR' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                                {item.action}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{item.count} items</span>
                                            {item.url !== "#" && (
                                                <a href={item.url} download={item.name} className="flex items-center gap-1.5 text-xs font-black text-indigo-600">
                                                    <Download className="w-4 h-4" /> DL
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {feedbacks.length > 0 && (
                        <div className="bg-amber-50/50 rounded-[3rem] p-10 border border-amber-100 shadow-xl shadow-amber-200/20 animate-slide">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-black text-amber-600 flex items-center gap-3 uppercase text-xs tracking-[0.3em]">
                                    <MessageSquare className="w-5 h-5" />
                                    Received Requests (届いた要望)
                                </h3>
                                <button 
                                    onClick={downloadFeedbackCSV}
                                    className="bg-white border border-amber-200 text-amber-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-amber-100 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" /> CSV出力
                                </button>
                            </div>
                            <div className="space-y-4">
                                {feedbacks.map(fb => (
                                    <div key={fb.id} className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm relative group">
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed mb-3">{fb.text}</p>
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{fb.time}</span>
                                            <button 
                                                onClick={() => {
                                                    const updated = feedbacks.filter(f => f.id !== fb.id);
                                                    setFeedbacks(updated);
                                                    localStorage.setItem('ostrich_feedbacks', JSON.stringify(updated));
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 text-[10px] font-black uppercase transition-all"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 text-center">
                                <p className="text-[10px] text-amber-500 font-bold italic">※これらは現在このブラウザにのみ保存されています</p>
                            </div>
                        </div>
                    )}
                </div>

                {(isDesignCheckEnabled || isRagEnabled) && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border-4 border-emerald-100 rounded-[3rem] p-8 shadow-xl shadow-emerald-100/20 flex flex-col gap-6 sticky top-8"
                    >
                        <div className="flex items-center gap-3 border-b border-emerald-50 pb-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-800">解析・チェック指示</h4>
                                <p className="text-[10px] font-bold text-slate-400">AIへの追加リクエスト</p>
                            </div>
                        </div>
                        
                        <div className="flex-grow flex flex-col gap-3">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">カスタムプロンプト</label>
                            <textarea 
                                value={designCheckCustomPrompt}
                                onChange={(e) => setDesignCheckCustomPrompt(e.target.value)}
                                placeholder="例：平面図と立面図だけのチェックである。アンテナの高さに注目して。"
                                className="w-full h-64 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-sm font-bold text-slate-700 outline-none focus:border-emerald-300 transition-all resize-none"
                            />
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                                ※具体的な指示を入力することで、より精度の高い解析結果が得られます。
                            </p>
                        </div>

                        {designCheckCustomPrompt && (
                            <button 
                                onClick={() => setDesignCheckCustomPrompt("")}
                                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-black transition-all flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" /> 指示をクリア
                            </button>
                        )}
                    </motion.div>
                )}
            </div>

            <div className="fixed bottom-8 right-8 flex flex-col items-end gap-3">
                <button onClick={() => setShowChangelog(true)} className="bg-white/95 backdrop-blur shadow-2xl border border-slate-200 px-6 py-3 rounded-full text-xs font-black text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    {APP_VERSION}
                </button>
            </div>

            <AnimatePresence>
                {showChangelog && (
                    <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-6" onClick={() => setShowChangelog(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Logs</h2>
                                <button onClick={() => setShowChangelog(false)} className="p-3 hover:bg-slate-200 rounded-full">
                                    <X className="w-8 h-8 text-slate-400" />
                                </button>
                            </div>
                            <div className="p-10 max-h-[65vh] overflow-y-auto space-y-10">
                                {CHANGE_LOGS.map((log) => (
                                    <div key={log.version} className="relative pl-10 border-l-2 border-indigo-100 last:border-0 pb-4">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-4 border-indigo-500"></div>
                                        <div className="mb-4 flex items-center gap-4">
                                            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl shadow-sm">{log.version}</span>
                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{log.date}</span>
                                        </div>
                                        <h4 className="font-black text-slate-900 text-lg mb-4">{log.title}</h4>
                                        <ul className="space-y-3">
                                            {log.details.map((d, i) => (
                                                <li key={i} className="text-base text-slate-500 flex items-start gap-3">
                                                    <span className="text-indigo-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400"></span> {d}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <div className="p-8 bg-slate-900 text-center">
                                <p className="text-xs text-slate-500 font-black tracking-[0.5em] uppercase italic">Ostrich Egg Hatching Utility</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
>>>>>>> fc69177 (feat: 設計チェック、AI解析を個別に出力変更)
