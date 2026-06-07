import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { filesToMediaItems, isImageType, isVideoType } from '../utils/media.js';

const categories = ['General', 'Technology', 'News', 'Tutorial', 'Other'];

export default function AddContentPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [status, setStatus] = useState('published');
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMediaChange = async (event) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    setUploadingMedia(true);

    try {
      const nextItems = await filesToMediaItems(files);
      setMediaItems((current) => [...current, ...nextItems]);
      event.target.value = '';
    } catch (error) {
      toast.error('Unable to read selected media');
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMediaItem = (index) => {
    setMediaItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await api.post('/content', {
        title,
        description,
        category,
        status,
        tags,
        isFeatured,
        mediaItems
      });
      toast.success('Content created');
      navigate('/content');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 md:p-8">
      <p className="panel-heading">Create content</p>
      <h2 className="mt-2 text-3xl font-semibold text-white">Add new content</h2>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="label">Title</label>
          <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="field min-h-40" value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>

        <div>
          <label className="label">Photos and videos</label>
          <input
            className="field cursor-pointer py-2.5"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaChange}
          />
          <p className="mt-2 text-xs text-slate-400">
            Add images or short videos. Larger files may take a little longer to upload.
          </p>
        </div>

        {mediaItems.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mediaItems.map((item, index) => (
              <div key={`${item.name}-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                {isVideoType(item.type) ? (
                  <video className="h-48 w-full object-cover" controls src={item.dataUrl} />
                ) : isImageType(item.type) ? (
                  <img className="h-48 w-full object-cover" src={item.dataUrl} alt={item.name} />
                ) : (
                  <div className="flex h-48 items-center justify-center text-slate-400">Unsupported media</div>
                )}
                <div className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{item.kind}</p>
                  </div>
                  <button className="btn-secondary py-2" type="button" onClick={() => removeMediaItem(index)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Category</label>
            <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <label className="label">Tags</label>
            <input
              className="field"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="news, updates, design"
            />
            <p className="mt-2 text-xs text-slate-400">Separate tags with commas.</p>
          </div>
          <div className="md:pt-[31px]">
            <label className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-slate-200">
              <input
                checked={isFeatured}
                onChange={(event) => setIsFeatured(event.target.checked)}
                className="h-4 w-4 accent-cyan-400"
                type="checkbox"
              />
              Featured post
            </label>
          </div>
        </div>

        <button className="btn-primary" disabled={loading} type="submit">
          {loading || uploadingMedia ? 'Preparing...' : 'Save Content'}
        </button>
      </form>
    </div>
  );
}
