import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Edit3,
  Plus,
  Search,
  Users,
  Award,
  Calendar,
  FileCheck,
  Check,
} from 'lucide-react';
import { StudentApplicationRecord, User } from '../types';

interface OrganizationPanelViewProps {
  user: User | null;
  studentRecords: StudentApplicationRecord[];
  onUpdateStudentRecord: (id: string, updates: Partial<StudentApplicationRecord>) => Promise<void>;
  onCreateStudentRecord: (newRecord: Partial<StudentApplicationRecord>) => Promise<void>;
}

const STATUS_OPTIONS: StudentApplicationRecord['status'][] = [
  'Under Review',
  'Approved by Placement',
  'Submitted',
  'Interview Scheduled',
  'Offer Received',
  'Needs Changes',
];

export const OrganizationPanelView: React.FC<OrganizationPanelViewProps> = ({
  user,
  studentRecords,
  onUpdateStudentRecord,
  onCreateStudentRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmployer, setEditEmployer] = useState('');
  const [editStatus, setEditStatus] = useState<StudentApplicationRecord['status']>('Under Review');

  // New Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRoll, setNewRoll] = useState('');
  const [newDept, setNewDept] = useState('B.Tech Computer Science');
  const [newCgpa, setNewCgpa] = useState('8.90');
  const [newRole, setNewRole] = useState('Software Engineer - Backend');
  const [newEmployer, setNewEmployer] = useState('Stripe India');
  const [newPortal, setNewPortal] = useState('Greenhouse ATS');
  const [newMinutes, setNewMinutes] = useState(
    'Verified student resume and academic transcript. Approved for 1-hour career portal auto-apply.'
  );

  const filteredRecords = studentRecords.filter(rec => {
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        rec.studentName.toLowerCase().includes(q) ||
        rec.rollNumber.toLowerCase().includes(q) ||
        rec.employer.toLowerCase().includes(q) ||
        rec.targetRole.toLowerCase().includes(q) ||
        rec.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const interviewCount = studentRecords.filter(r => r.status === 'Interview Scheduled').length;
  const offerCount = studentRecords.filter(r => r.status === 'Offer Received').length;
  const approvedCount = studentRecords.filter(
    r => r.status === 'Approved by Placement' || r.status === 'Submitted'
  ).length;

  const handleStartEdit = (rec: StudentApplicationRecord) => {
    setEditingId(rec.id);
    setEditMinutes(rec.placementMinutes);
    setEditRole(rec.targetRole);
    setEditEmployer(rec.employer);
    setEditStatus(rec.status);
  };

  const handleSaveEdit = async (id: string) => {
    await onUpdateStudentRecord(id, {
      placementMinutes: editMinutes,
      targetRole: editRole,
      employer: editEmployer,
      status: editStatus,
    });
    setEditingId(null);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateStudentRecord({
      studentName: newName,
      studentEmail: newEmail,
      rollNumber: newRoll,
      department: newDept,
      collegeOrOrgName: user?.organizationName || 'University Career Placement Cell',
      cgpa: newCgpa,
      targetRole: newRole,
      employer: newEmployer,
      portalName: newPortal,
      status: 'Approved by Placement',
      placementMinutes: newMinutes,
    });
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewRoll('');
  };

  return (
    <div className="space-y-6">
      {/* Top Royal Blue Organization & College Hero Banner */}
      <div className="relative rounded-[28px] bg-[#1D58D8] text-white px-7 py-8 sm:px-10 overflow-hidden shadow-sm">
        <div
          className="pointer-events-none absolute -right-12 -bottom-24 w-96 h-96 rounded-full bg-[#2563EB]/70"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>Organization & College Placement Panel</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {user?.organizationName || 'University & College Placement Cell'}
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl">
              Monitor real-time student job applications, record placement committee minutes, verify student resumes, and update application statuses across career portals.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-blue-50 text-[#1D58D8] font-bold text-sm shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Student Application</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Students Monitored</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
              {studentRecords.length}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Placement Approved</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
              {approvedCount}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Interviews Scheduled</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
              {interviewCount}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Offers Received</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
              {offerCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll no, role, or company..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#F4F6FB] border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', ...STATUS_OPTIONS] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#F4F6FB] text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All Students' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Student Applications & Placement Minutes List */}
      <div className="space-y-4">
        {filteredRecords.map(rec => {
          const isEditing = editingId === rec.id;
          const initial = rec.studentName.charAt(0).toUpperCase();

          return (
            <div
              key={rec.id}
              className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-2xs space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white font-extrabold text-base flex items-center justify-center shrink-0">
                    {initial}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-base text-slate-900">
                        {rec.studentName}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                        {rec.rollNumber}
                      </span>
                      <span className="text-xs text-slate-500">· {rec.department}</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        CGPA {rec.cgpa}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-[#1D58D8] mt-1">
                      {rec.targetRole} · <span className="text-slate-800">{rec.employer}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>Portal: {rec.portalName}</span>
                      <span>·</span>
                      <span>Match Fit: {rec.matchScore}%</span>
                      <span>·</span>
                      <span>Email: {rec.studentEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Dropdown + Resume Verification + Edit Minutes Button */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <select
                    aria-label={`Change status for ${rec.studentName}`}
                    value={rec.status}
                    onChange={e =>
                      onUpdateStudentRecord(rec.id, {
                        status: e.target.value as StudentApplicationRecord['status'],
                      })
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                      rec.status === 'Offer Received' || rec.status === 'Interview Scheduled'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : rec.status === 'Needs Changes'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : rec.status === 'Approved by Placement'
                        ? 'bg-blue-50 text-[#1D58D8] border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateStudentRecord(rec.id, { resumeVerified: !rec.resumeVerified })
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      rec.resumeVerified
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {rec.resumeVerified ? '✓ Resume Verified' : 'Verify Resume'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(rec)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Minutes & Role</span>
                  </button>
                </div>
              </div>

              {/* Placement Minutes & Colleague Notes Box */}
              {isEditing ? (
                <div className="p-4 rounded-2xl bg-[#F4F6FB] border border-blue-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800">
                    Update Student Application Details & Placement Committee Minutes
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Target Role
                      </label>
                      <input
                        type="text"
                        value={editRole}
                        onChange={e => setEditRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Target Employer
                      </label>
                      <input
                        type="text"
                        value={editEmployer}
                        onChange={e => setEditEmployer(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Application Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={e =>
                          setEditStatus(e.target.value as StudentApplicationRecord['status'])
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900"
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Official Placement Minutes / Colleague Review Notes
                    </label>
                    <textarea
                      rows={2}
                      value={editMinutes}
                      onChange={e => setEditMinutes(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(rec.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1D58D8] text-white text-xs font-bold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Minutes & Status</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#F4F6FB] border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">Placement Minutes: </span>
                    <span className="text-slate-700">{rec.placementMinutes}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 shrink-0">
                    Updated by {rec.updatedBy}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Student Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">
              Add Student Application to Placement Tracker
            </h2>

            <form onSubmit={handleAddStudent} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Siddharth Rao"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={newRoll}
                    onChange={e => setNewRoll(e.target.value)}
                    placeholder="e.g. CS22B091"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Gmail / College ID</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department & CGPA</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Role</label>
                  <input
                    type="text"
                    required
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employer & Portal</label>
                  <input
                    type="text"
                    required
                    value={newEmployer}
                    onChange={e => setNewEmployer(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Placement Committee Minutes
                </label>
                <textarea
                  rows={2}
                  value={newMinutes}
                  onChange={e => setNewMinutes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1D58D8] text-white text-xs font-bold"
                >
                  Register Student Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
