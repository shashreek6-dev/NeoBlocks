import { useState } from "react";
import { JAVA_PROJECT_FILES, SourceFile } from "../javaCodeTemplates";
import { Copy, Check, FileCode, HardDrive, Terminal, Info, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function SourceCodeHub() {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copiedFileIndex, setCopiedFileIndex] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<"code" | "guide">("code");

  const selectedFile = JAVA_PROJECT_FILES[selectedFileIndex];

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedFileIndex(idx);
    setTimeout(() => {
      setCopiedFileIndex(null);
    }, 2000);
  };

  return (
    <div className="bg-white border-2 border-sky-200 rounded-3xl overflow-hidden shadow-xl h-full flex flex-col">
      {/* Tab bar header */}
      <div className="bg-sky-50 p-4 border-b border-sky-100 flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-base font-serif italic text-sky-950 flex items-center gap-2 font-bold">
            <Terminal className="w-5 h-5 text-sky-550" />
            Eclipse Tomcat DAO Exporter
          </h3>
          <p className="text-xs text-sky-700/80 font-serif font-semibold">Ready-made MVC template architecture (JSTL + Servlet + DAO)</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-sky-100">
          <button
            onClick={() => setCurrentTab("code")}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif italic flex items-center gap-1.5 transition duration-200 ${
              currentTab === "code"
                ? "bg-sky-500 text-white font-bold shadow-sm"
                : "text-sky-700/70 hover:text-sky-950 hover:bg-sky-50"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Code Repository
          </button>
          <button
            onClick={() => setCurrentTab("guide")}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif italic flex items-center gap-1.5 transition duration-200 ${
              currentTab === "guide"
                ? "bg-sky-500 text-white font-bold shadow-sm"
                : "text-sky-700/70 hover:text-sky-950 hover:bg-sky-50"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Deployment Manual
          </button>
        </div>
      </div>

      {currentTab === "code" ? (
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 min-h-[480px]">
          {/* File sidebar selector */}
          <div className="col-span-1 bg-sky-50/30 p-4 border-r border-sky-100 flex flex-col gap-1.5 overflow-y-auto max-h-[150px] lg:max-h-none">
            <span className="text-[10px] font-mono text-sky-850/60 font-extrabold uppercase tracking-widest mb-2 px-2">PROJECT STRUCT</span>
            {JAVA_PROJECT_FILES.map((file, idx) => (
              <button
                key={file.name}
                id={`file-btn-${file.name}`}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs transition duration-155 flex items-center justify-between border ${
                  idx === selectedFileIndex
                    ? "bg-sky-50 border-sky-300 text-sky-700 font-serif italic font-bold"
                    : "border-transparent text-sky-700/60 hover:bg-sky-50/80 hover:text-sky-950"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sky-600/60">
                    {file.name.endsWith(".java") ? "☕" : file.name.endsWith(".jsp") ? "📁" : file.name.endsWith(".sql") ? "💾" : "⚙️"}
                  </span>
                  <span className="truncate">{file.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Code Viewer Panel */}
          <div className="col-span-3 p-5 flex flex-col h-full bg-white">
            {/* Meta-info banner */}
            <div className="mb-4 bg-sky-50 border border-sky-100 p-4 rounded-xl flex justify-between items-start gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-600 tracking-wider font-mono">
                    /{selectedFile.path}
                  </span>
                </div>
                <p className="text-xs text-sky-850/70 font-semibold font-serif">
                  {selectedFile.description}
                </p>
              </div>
              <button
                onClick={() => handleCopy(selectedFile.code, selectedFileIndex)}
                className="shrink-0 bg-white hover:bg-sky-50 border border-sky-200 hover:border-sky-450 py-2 px-4 rounded-lg text-xs font-serif italic text-sky-800 transition duration-150 flex items-center gap-2 shadow-sm"
              >
                {copiedFileIndex === selectedFileIndex ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">In Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Source</span>
                  </>
                )}
              </button>
            </div>

            {/* Structured code box inside a gorgeous dark code contrast slate */}
            <div className="flex-grow bg-slate-900 rounded-xl p-4 border border-slate-800 overflow-auto max-h-[460px] font-mono text-[11px] leading-relaxed text-sky-100/90 relative select-text shadow-inner">
              <pre className="whitespace-pre">
                <code>{selectedFile.code}</code>
              </pre>
            </div>
          </div>
        </div>
      ) : (
        /* Eclipse Dynamic Web Project & Tomcat Tutorial */
        <div className="flex-grow p-6 overflow-y-auto max-h-[580px] space-y-6 text-sm text-sky-950 select-text bg-white">
          <div className="bg-gradient-to-r from-sky-50 to-white border border-sky-100 p-5 rounded-xl space-y-3 shadow-md">
            <h4 className="text-sky-950 font-serif italic text-base flex items-center gap-2 font-bold">
              🛠️ Eclipse Dynamic JSP/Servlet Project Blueprint
            </h4>
            <p className="text-sky-850/80 leading-relaxed text-xs font-serif font-semibold">
              This system compiles the code required to run a full-stack Web Application in **Eclipse IDE for Enterprise Java**. It integrates user accounts and leaderboards under a clean **model-view-controller (MVC)** scheme using **JSTL (JavaServer Pages Standard Tag Library)**, Expression Language (EL), and standard Java Servlets with DAOs.
            </p>
          </div>

          <div className="space-y-4">
            <h5 className="font-serif italic text-sky-950 text-sm flex items-center gap-2 border-b border-sky-100 pb-2 font-bold">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold font-mono">1</span>
              Create the Dynamic Web Project in Eclipse
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-xs leading-relaxed text-sky-850/80 font-serif">
              <li>Open Eclipse (ensure you are using "Eclipse IDE for Enterprise Java and Web Developers").</li>
              <li>Go to <strong className="text-sky-600">File &gt; New &gt; Dynamic Web Project</strong>.</li>
              <li>Set <strong className="text-sky-950 font-bold">Project Name</strong> as <span className="font-mono text-sky-600 bg-sky-50 px-1 py-0.5 rounded font-bold">BlockPuzzleGame</span>.</li>
              <li>Under <strong className="text-sky-950 font-bold">Target Runtime</strong>, select or add your <strong className="text-sky-600 font-bold">Apache Tomcat</strong> server (v9.0 or v10.0+ are standard).</li>
              <li>Click <span className="font-semibold text-sky-950">Finish</span>.</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h5 className="font-serif italic text-sky-950 text-sm flex items-center gap-2 border-b border-sky-100 pb-2 font-bold">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold font-mono">2</span>
              Add JSTL Standard Jar Libraries
            </h5>
            <div className="pl-8 text-xs space-y-2 text-sky-850/85">
              <p className="font-serif">For JSP expressions and loops to operate securely, you must deposit standard JSTL library files into the project libraries directory:</p>
              <div className="bg-sky-50 p-4 border border-sky-100 rounded-xl space-y-2 text-[11px] font-semibold">
                <p className="text-sky-600 font-extrabold">📥 For TomCat 9.0/8.5 (uses javax.servlet namespaces):</p>
                <p className="text-sky-950 font-serif">Download <strong className="text-sky-950 font-mono font-bold">jstl-1.2.jar</strong> and <strong className="text-sky-950 font-mono font-bold">standard-1.1.2.jar</strong>. Drag them into <span className="text-sky-600 font-mono font-bold">WebContent/WEB-INF/lib/</span>.</p>
                
                <p className="text-sky-600 font-extrabold mt-3">📥 For TomCat 10.0+ (uses jakarta.servlet namespaces):</p>
                <p className="text-sky-950 font-serif">Download <strong className="text-sky-950 font-mono font-bold">jakarta.servlet.jsp.jstl-api-2.0.0.jar</strong> and <strong className="text-sky-950 font-mono font-bold">jakarta.servlet.jsp.jstl-3.0.1.jar</strong>. Deposit into lib.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="font-serif italic text-sky-950 text-sm flex items-center gap-2 border-b border-sky-100 pb-2 font-bold">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold font-mono">3</span>
              Initialize the Database & Drivers
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-xs leading-relaxed text-sky-850/80 font-serif">
              <li>Deploy the SQL table definitions in <strong className="text-sky-600">schema.sql</strong> inside your MySQL / SQLite database workspace.</li>
              <li>Download the official JDBC Connector jar: <strong className="text-sky-950 font-mono">mysql-connector-j-x.x.x.jar</strong>.</li>
              <li>Deposit this Connector jar file in <span className="font-mono text-sky-600 bg-sky-50 px-1 py-0.5 rounded font-bold font-mono">WebContent/WEB-INF/lib/</span> so Eclipse and Tomcat can connect to databases automatically at runtime.</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h5 className="font-serif italic text-sky-950 text-sm flex items-center gap-2 border-b border-sky-100 pb-2 font-bold">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold font-mono">4</span>
              Create Java Packages & Files
            </h5>
            <div className="pl-8 text-xs text-sky-850/80 font-serif space-y-2">
              <p>Under the <span className="text-sky-950 font-mono font-bold">Java Resources &gt; src</span> folder in Eclipse, create packages to match the paths specified in the exporter sidebar:</p>
              <ul className="list-disc list-inside pl-4 space-y-1 text-sky-950 font-bold font-mono text-[11px]">
                <li><span className="text-sky-600">com.game.util</span> (Create DBConnection.java here)</li>
                <li><span className="text-sky-600">com.game.model</span> (Create User.java and HighScore.java here)</li>
                <li><span className="text-sky-600">com.game.dao</span> (Create UserDAO.java and HighScoreDAO.java here)</li>
                <li><span className="text-sky-600">com.game.controller</span> (Create GameServlet.java here)</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="font-serif italic text-sky-950 text-sm flex items-center gap-2 border-b border-sky-100 pb-2 font-bold">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold font-mono">5</span>
              Run on Server
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-xs leading-relaxed text-sky-850/80 font-serif">
              <li>Right-click your project directory <strong className="text-sky-950 font-mono font-bold">BlockPuzzleGame</strong>.</li>
              <li>Select <strong className="text-sky-600 font-bold">Run As &gt; Run on Server</strong>.</li>
              <li>Choose your Dynamic Tomcat Server and click <strong className="text-sky-950">Finish</strong>.</li>
              <li>Access the game locally at <span className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold font-mono">http://localhost:8080/BlockPuzzleGame/</span> inside Eclipse's browser or any external browser.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
