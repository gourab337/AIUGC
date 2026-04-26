import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Trash2, ChevronRight, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStudioStore } from '../store/studio';
import { projectsApi } from '../api/client';
import { NewProjectModal } from '../components/ui/NewProjectModal';
import { UGC_TEMPLATES } from '../data/ugcTemplates';
import type { Project, UGCNiche } from '../types';

const STEP_ICONS: Record<string, string> = { script: '✦', image: '◈', voice: '◉', video: '▶' };

function NicheBadge({ niche }: { niche: UGCNiche }) {
  const t = UGC_TEMPLATES[niche];
  return (
    <span
      style={{
        fontSize: 9,
        fontFamily: 'JetBrains Mono',
        letterSpacing: '0.06em',
        color: t.colorAccent,
        border: `1px solid ${t.colorAccent}40`,
        borderRadius: 4,
        padding: '2px 6px',
        background: `${t.colorAccent}10`,
      }}
    >
      {t.label.toUpperCase()}
    </span>
  );
}

function AssetBar({ assets }: { assets: Project['assets'] }) {
  const counts = { script: 0, image: 0, voice: 0, video: 0 };
  assets.forEach(a => counts[a.type]++);
  return (
    <div className="flex items-center gap-3">
      {Object.entries(counts).map(([type, count]) => (
        <span key={type} style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: count > 0 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
          {STEP_ICONS[type]} {count}
        </span>
      ))}
    </div>
  );
}

export function Projects() {
  const navigate = useNavigate();
  const { projects, setProjects, addOrUpdateProject, removeProject, setActiveProjectId, activeProjectId } = useStudioStore();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.list()
      .then(setProjects)
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(data: { name: string; client: string; niche?: UGCNiche; description?: string }) {
    try {
      const project = await projectsApi.create(data);
      addOrUpdateProject(project);
      setActiveProjectId(project.id);
      setShowModal(false);
      toast.success(`Project "${project.name}" created`);
    } catch {
      toast.error('Failed to create project');
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await projectsApi.delete(id);
      removeProject(id);
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  }

  function handleActivate(project: Project) {
    setActiveProjectId(project.id);
    toast.success(`Active: ${project.name}`);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6"
        style={{ height: 56, borderBottom: '1px solid var(--border)', flexShrink: 0 }}
      >
        <div className="flex items-center gap-3">
          <Layers size={16} style={{ color: 'var(--amber)' }} />
          <span style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Projects
          </span>
          {projects.length > 0 && (
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }}>
              {projects.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 transition-all duration-150"
          style={{
            background: 'var(--amber)',
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            cursor: 'pointer',
            fontFamily: 'Syne',
            fontSize: 12,
            fontWeight: 700,
            color: '#070708',
            letterSpacing: '0.02em',
          }}
        >
          <Plus size={13} />
          New Project
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)' }}>
              Loading projects…
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-4"
            style={{ height: 300, border: '1px dashed var(--border)', borderRadius: 12 }}
          >
            <FolderOpen size={32} style={{ color: 'var(--text-muted)' }} />
            <div style={{ fontFamily: 'Syne', fontSize: 14, color: 'var(--text-secondary)' }}>
              No projects yet
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 280 }}>
              Create a project to organize your UGC experiments and assets.
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: 'var(--amber)',
                border: 'none',
                borderRadius: 6,
                padding: '8px 20px',
                cursor: 'pointer',
                fontFamily: 'Syne',
                fontSize: 13,
                fontWeight: 700,
                color: '#070708',
              }}
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map(project => {
              const isActive = activeProjectId === project.id;
              return (
                <div
                  key={project.id}
                  className="group flex items-center gap-4 rounded-lg px-4 py-3 cursor-pointer transition-all duration-150"
                  style={{
                    background: isActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                    border: `1px solid ${isActive ? 'var(--amber)' : 'var(--border)'}`,
                  }}
                  onClick={() => handleActivate(project)}
                >
                  {/* Active dot */}
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? 'var(--amber)' : 'var(--border)', flexShrink: 0, transition: 'background 150ms' }} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {project.name}
                      </span>
                      {project.niche && <NicheBadge niche={project.niche} />}
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)' }}>
                        {project.client}
                      </span>
                      <span style={{ color: 'var(--border)' }}>·</span>
                      <AssetBar assets={project.assets} />
                      <span style={{ color: 'var(--border)' }}>·</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)' }}>
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}
                      title="Open project"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                      className="hover:text-white transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      onClick={e => handleDelete(e, project.id, project.name)}
                      title="Delete project"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                      className="hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
