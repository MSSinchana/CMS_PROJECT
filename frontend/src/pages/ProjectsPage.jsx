import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ProjectsPage({ projects, setProjects, selectedProjectId, setSelectedProjectId }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const loadProjects = async () => {
    try {
      const { data } = await api.get('/api/projects');
      setProjects(data);
      if (!selectedProjectId && data.length) {
        setSelectedProjectId(data[0].id);
      }
    } catch {
      setError('Failed to load projects.');
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const createProject = async (event) => {
    event.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    try {
      const { data } = await api.post('/api/projects', { name, description });
      setProjects([data, ...projects]);
      setSelectedProjectId(data.id);
      setName('');
      setDescription('');
    } catch {
      setError('Unable to create project.');
    }
  };

  return (
    <div className="grid two-col">
      <div className="card">
        <h2>Create Project</h2>
        <form onSubmit={createProject} className="form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={4} />
          <button className="btn" type="submit">Create</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </div>

      <div className="card">
        <h2>Projects</h2>
        {!projects.length ? (
          <p className="empty">No projects yet.</p>
        ) : (
          <ul className="project-list">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  className={project.id === selectedProjectId ? 'project-btn active' : 'project-btn'}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <strong>{project.name}</strong>
                  <p>{project.description || 'No description'}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
