import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit2,
  Archive,
  Star,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { FactConflict, ResumeVersion } from '../types';

interface ResumesViewProps {
  resumes: ResumeVersion[];
  conflicts: FactConflict[];
  onUploadResume: (resumeData: {
    title: string;
    filename: string;
    intendedRoles: string[];
    highlightedSkills: string[];
    rawTextPreview: string;
  }) => void;
  onUpdateResume: (id: string, updates: Partial<ResumeVersion>) => void;
  onDeleteResume: (id: string) => void;
}

export const ResumesView: React.FC<ResumesViewProps> = ({
  resumes,
  conflicts,
  onUploadResume,
  onUpdateResume,
  onDeleteResume,
}) => {
  const [selectedResume, setSelectedResume] = useState<ResumeVersion | null>(resumes[0] || null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadRoles, setUploadRoles] = useState('Full Stack Engineer, Python Developer');
  const [uploadSkills, setUploadSkills] = useState('Python, React, TypeScript, PostgreSQL');
  const [simulatedFilename, setSimulatedFilename] = useState('narasimhulu_tailored_resume.pdf');

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    onUploadResume({
      title: uploadTitle.trim(),
      filename: simulatedFilename,
      intendedRoles: uploadRoles.split(',').map(s => s.trim()).filter(Boolean),
      highlightedSkills: uploadSkills.split(',').map(s => s.trim()).filter(Boolean),
      rawTextPreview: `Narasimhulu — Tailored resume targeting ${uploadRoles}. Technical core: ${uploadSkills}. Verified education: IIT Madras B.Tech CS 2021.`,
    });

    setUploadTitle('');
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Candidate Assets</span>
              <span>·</span>
              <span>Immutable Versioning</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resume Library</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Upload role-specific resumes. Each version maintains an immutable ID and extraction profile.
              ApplyPilot attaches the correct resume per explicit selection or campaign rules, never attaching unrelated files.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Resume</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Resumes List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Library Versions ({resumes.length})
          </div>

          {resumes.map(r => {
            const isSelected = selectedResume?.id === r.id;
            const hasConflict = conflicts.some(c => !c.resolved && (c.sourceA.includes(r.id) || c.sourceB.includes(r.id)));

            return (
              <div
                key={r.id}
                onClick={() => setSelectedResume(r)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-slate-900 bg-white shadow-sm ring-1 ring-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm">{r.title}</h3>
                      {r.isDefault && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      v{r.versionNumber} · {(r.filesizeBytes / 1024).toFixed(0)} KB · {r.filename}
                    </div>
                  </div>

                  {hasConflict && (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {r.highlightedSkills.slice(0, 3).map(skill => (
                    <span key={skill} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                  {r.highlightedSkills.length > 3 && (
                    <span className="text-[11px] text-slate-400">+{r.highlightedSkills.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Resume Detail & Fact Inspection */}
        <div className="lg:col-span-2">
          {selectedResume ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedResume.title}</h2>
                    <span className="text-xs text-slate-500 font-mono">ID: {selectedResume.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Uploaded on {new Date(selectedResume.uploadDate).toLocaleDateString()} · Immutable snapshot
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!selectedResume.isDefault && (
                    <button
                      onClick={() => onUpdateResume(selectedResume.id, { isDefault: true })}
                      className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteResume(selectedResume.id)}
                    className="p-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-xs"
                    aria-label="Delete Resume Version"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Roles & Competencies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                    Intended Roles
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResume.intendedRoles.map(role => (
                      <span key={role} className="text-xs bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-md font-medium">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                    Highlighted Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResume.highlightedSkills.map(skill => (
                      <span key={skill} className="text-xs bg-white border border-slate-200 text-slate-800 px-2.5 py-1 rounded-md font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extracted Facts Summary */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Verified Extracted Facts
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                  {selectedResume.extractedFactsSummary.map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                </ul>
              </div>

              {/* Raw Text Preview */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Document Content Preview
                </h4>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedResume.rawTextPreview}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              Select a resume from the list to view its extraction details and version metadata.
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Upload New Resume Version</h2>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resume Title / Specialization
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer (Distributed Systems)"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File Upload (PDF or DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setSimulatedFilename(e.target.files[0].name);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Roles (Comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadRoles}
                  onChange={e => setUploadRoles(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Highlighted Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadSkills}
                  onChange={e => setUploadSkills(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
                >
                  Upload & Extract Facts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
