'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './ContentEditor.module.css';
import { useAdmin } from '../../context/AdminContext';
import useSiteContent from '../../hooks/useSiteContent';

const emptyWork = {
  body: '',
  coverUrl: '',
  externalUrl: '',
  featured: false,
  galleryUrls: [],
  published: true,
  repoUrl: '',
  slug: '',
  sortOrder: 0,
  summary: '',
  tags: [],
  title: '',
  type: 'project',
};

const emptySkill = {
  category: 'Core',
  iconUrl: '',
  label: '',
  weight: 60,
};

const emptyExperience = {
  description: '',
  organization: '',
  period: '',
  sortOrder: 0,
  title: '',
  type: 'experience',
};

const emptyTrack = {
  accentColor: '',
  artist: '',
  artworkUrl: '',
  published: true,
  sortOrder: 0,
  title: '',
  youtubeUrl: '',
};

export default function ContentEditor() {
  const { sessionToken } = useAdmin();
  const {
    deleteExperience,
    deleteReview,
    deleteSkill,
    deleteTrack,
    deleteWork,
    experience,
    reviews,
    saveExperience,
    saveSiteSettings,
    saveSkill,
    saveTrack,
    saveWork,
    siteSettings,
    skills,
    tracks,
    works,
  } = useSiteContent();
  const [activePane, setActivePane] = useState('settings');
  const [status, setStatus] = useState('');
  const [settingsForm, setSettingsForm] = useState(() => ({
    bio: siteSettings?.bio || '',
    email: siteSettings?.email || '',
    github: siteSettings?.github || '',
    heroCta: siteSettings?.heroCta || '',
    location: siteSettings?.location || '',
    name: siteSettings?.name || '',
    tagline: siteSettings?.tagline || '',
    defaultTrackId: siteSettings?.defaultTrackId || '',
  }));
  const [workForm, setWorkForm] = useState(emptyWork);
  const [skillForm, setSkillForm] = useState(emptySkill);
  const [experienceForm, setExperienceForm] = useState(emptyExperience);
  const [trackForm, setTrackForm] = useState(emptyTrack);

  useEffect(() => {
    if (!siteSettings) {
      return;
    }

    setSettingsForm({
      bio: siteSettings.bio || '',
      email: siteSettings.email || '',
      github: siteSettings.github || '',
      heroCta: siteSettings.heroCta || '',
      location: siteSettings.location || '',
      name: siteSettings.name || '',
      tagline: siteSettings.tagline || '',
      defaultTrackId: siteSettings.defaultTrackId || '',
    });
  }, [siteSettings]);

  const hydrateWorkForm = (work) =>
    setWorkForm({
      body: work.body || '',
      coverUrl: work.coverUrl || work.cover_url || '',
      externalUrl: work.externalUrl || work.external_url || '',
      featured: Boolean(work.featured),
      galleryUrls: work.galleryUrls || [],
      id: work.id,
      published: work.published !== false,
      repoUrl: work.repoUrl || work.repo_url || '',
      slug: work.slug || '',
      sortOrder: work.sortOrder || work.sort_order || 0,
      summary: work.summary || '',
      tags: work.tags || [],
      title: work.title || '',
      type: work.type || 'project',
    });

  const panes = useMemo(
    () => [
      ['settings', 'Site settings'],
      ['tracks', 'Tracks'],
      ['works', 'Works'],
      ['skills', 'Skills'],
      ['experience', 'Experience'],
      ['reviews', 'Reviews'],
    ],
    [],
  );

  const updateStatus = async (callback, successMessage) => {
    setStatus('Saving...');

    try {
      await callback();
      setStatus(successMessage);
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <section data-component="ContentEditor" className={styles.wrapper}>
      <div className={styles.panes}>
        {panes.map(([value, label]) => (
          <button key={value} type="button" onClick={() => setActivePane(value)}>
            {label}
          </button>
        ))}
      </div>

      {activePane === 'settings' ? (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void updateStatus(
              () => saveSiteSettings(settingsForm, sessionToken),
              'Site settings saved.',
            );
          }}
        >
          <h2>Site settings</h2>
          {['name', 'tagline', 'email', 'location', 'github', 'heroCta'].map((field) => (
            <label key={field}>
              <span>{field}</span>
              <input
                value={settingsForm[field]}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
          <label>
            <span>bio</span>
            <textarea
              rows="5"
              value={settingsForm.bio}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  bio: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>defaultTrackId</span>
            <select
              value={settingsForm.defaultTrackId}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  defaultTrackId: event.target.value,
                }))
              }
            >
              <option value="">No default track</option>
              {tracks
                .filter((track) => track.published !== false)
                .map((track) => (
                <option key={track.id} value={track.id}>
                  {track.title} - {track.artist}
                </option>
                ))}
            </select>
          </label>
          <button type="submit">Save settings</button>
        </form>
      ) : null}

      {activePane === 'tracks' ? (
        <div className={styles.split}>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void updateStatus(
                async () => {
                  await saveTrack(trackForm, sessionToken);
                  setTrackForm(emptyTrack);
                },
                'Track saved.',
              );
            }}
          >
            <h2>Tracks</h2>
            {['title', 'artist', 'artworkUrl', 'youtubeUrl', 'accentColor'].map(
              (field) => (
                <input
                  key={field}
                  placeholder={field}
                  value={trackForm[field]}
                  onChange={(event) =>
                    setTrackForm((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                />
              ),
            )}
            <input
              type="number"
              placeholder="Sort order"
              value={trackForm.sortOrder}
              onChange={(event) =>
                setTrackForm((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value),
                }))
              }
            />
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={trackForm.published}
                onChange={(event) =>
                  setTrackForm((current) => ({
                    ...current,
                    published: event.target.checked,
                  }))
                }
              />
              Published
            </label>
            <button type="submit">Save track</button>
          </form>

          <div className={styles.list}>
            {tracks.map((track) => (
              <article key={track.id}>
                <div>
                  <strong>{track.title}</strong>
                  <span>{track.artist}</span>
                </div>
                <div className={styles.listActions}>
                  <button
                    type="button"
                    onClick={() =>
                      setTrackForm({
                        accentColor: track.accentColor || track.accent_color || '',
                        artist: track.artist || '',
                        artworkUrl: track.artworkUrl || track.artwork_url || '',
                        id: track.id,
                        published: track.published !== false,
                        sortOrder: track.sortOrder || track.sort_order || 0,
                        title: track.title || '',
                        youtubeUrl: track.youtubeUrl || track.youtube_url || '',
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void updateStatus(
                        () => deleteTrack(track.id, sessionToken),
                        'Track deleted.',
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activePane === 'works' ? (
        <div className={styles.split}>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void updateStatus(
                async () => {
                  await saveWork(
                    {
                      ...workForm,
                      galleryUrls: workForm.galleryUrls
                        .join('\n')
                        .split('\n')
                        .map((value) => value.trim())
                        .filter(Boolean),
                      tags: workForm.tags
                        .join(',')
                        .split(',')
                        .map((value) => value.trim())
                        .filter(Boolean),
                    },
                    sessionToken,
                  );
                  setWorkForm(emptyWork);
                },
                'Work saved.',
              );
            }}
          >
            <h2>Works</h2>
            <select
              value={workForm.type}
              onChange={(event) =>
                setWorkForm((current) => ({ ...current, type: event.target.value }))
              }
            >
              <option value="project">Project</option>
              <option value="art">Art</option>
            </select>
            {['title', 'slug', 'summary', 'coverUrl', 'externalUrl', 'repoUrl'].map((field) => (
              <input
                key={field}
                placeholder={field}
                value={workForm[field]}
                onChange={(event) =>
                  setWorkForm((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
              />
            ))}
            <textarea
              rows="5"
              placeholder="Body"
              value={workForm.body}
              onChange={(event) =>
                setWorkForm((current) => ({ ...current, body: event.target.value }))
              }
            />
            <textarea
              rows="3"
              placeholder="Tags separated by commas"
              value={workForm.tags.join(', ')}
              onChange={(event) =>
                setWorkForm((current) => ({
                  ...current,
                  tags: event.target.value.split(','),
                }))
              }
            />
            <textarea
              rows="3"
              placeholder="Gallery URLs, one per line"
              value={workForm.galleryUrls.join('\n')}
              onChange={(event) =>
                setWorkForm((current) => ({
                  ...current,
                  galleryUrls: event.target.value.split('\n'),
                }))
              }
            />
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={workForm.featured}
                onChange={(event) =>
                  setWorkForm((current) => ({
                    ...current,
                    featured: event.target.checked,
                  }))
                }
              />
              Featured
            </label>
            <button type="submit">Save work</button>
          </form>

          <div className={styles.list}>
            {works.map((work) => (
              <article key={work.id}>
                <div>
                  <strong>{work.title}</strong>
                  <span>{work.type}</span>
                </div>
                <div className={styles.listActions}>
                  <button type="button" onClick={() => hydrateWorkForm(work)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void updateStatus(
                        () => deleteWork(work.id, sessionToken),
                        'Work deleted.',
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activePane === 'skills' ? (
        <div className={styles.split}>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void updateStatus(
                async () => {
                  await saveSkill(skillForm, sessionToken);
                  setSkillForm(emptySkill);
                },
                'Skill saved.',
              );
            }}
          >
            <h2>Skills</h2>
            {['label', 'iconUrl', 'category'].map((field) => (
              <input
                key={field}
                placeholder={field}
                value={skillForm[field]}
                onChange={(event) =>
                  setSkillForm((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
              />
            ))}
            <input
              type="number"
              min="0"
              max="100"
              value={skillForm.weight}
              onChange={(event) =>
                setSkillForm((current) => ({
                  ...current,
                  weight: Number(event.target.value),
                }))
              }
            />
            <button type="submit">Save skill</button>
          </form>

          <div className={styles.list}>
            {skills.map((skill) => (
              <article key={skill.id}>
                <div>
                  <strong>{skill.label}</strong>
                  <span>{skill.weight}</span>
                </div>
                <div className={styles.listActions}>
                  <button
                    type="button"
                    onClick={() =>
                      setSkillForm({
                        category: skill.category || 'Core',
                        iconUrl: skill.iconUrl || skill.icon_url || '',
                        id: skill.id,
                        label: skill.label || '',
                        weight: skill.weight || 0,
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void updateStatus(
                        () => deleteSkill(skill.id, sessionToken),
                        'Skill deleted.',
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activePane === 'experience' ? (
        <div className={styles.split}>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void updateStatus(
                async () => {
                  await saveExperience(experienceForm, sessionToken);
                  setExperienceForm(emptyExperience);
                },
                'Experience saved.',
              );
            }}
          >
            <h2>Experience</h2>
            {['type', 'title', 'organization', 'period'].map((field) => (
              <input
                key={field}
                placeholder={field}
                value={experienceForm[field]}
                onChange={(event) =>
                  setExperienceForm((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
              />
            ))}
            <textarea
              rows="5"
              placeholder="Description"
              value={experienceForm.description}
              onChange={(event) =>
                setExperienceForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
            <button type="submit">Save experience</button>
          </form>

          <div className={styles.list}>
            {experience.map((entry) => (
              <article key={entry.id}>
                <div>
                  <strong>{entry.title}</strong>
                  <span>{entry.period}</span>
                </div>
                <div className={styles.listActions}>
                  <button
                    type="button"
                    onClick={() =>
                      setExperienceForm({
                        description: entry.description || '',
                        id: entry.id,
                        organization: entry.organization || '',
                        period: entry.period || '',
                        sortOrder: entry.sortOrder || entry.sort_order || 0,
                        title: entry.title || '',
                        type: entry.type || 'experience',
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void updateStatus(
                        () => deleteExperience(entry.id, sessionToken),
                        'Experience deleted.',
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activePane === 'reviews' ? (
        <div className={styles.list}>
          {reviews.map((review) => (
            <article key={review.id}>
              <div>
                <strong>{review.name}</strong>
                <span>{review.email}</span>
                <p>{review.message}</p>
              </div>
              <div className={styles.listActions}>
                <button
                  type="button"
                  onClick={() =>
                    void updateStatus(
                      () => deleteReview(review.id, sessionToken),
                      'Review deleted.',
                    )
                  }
                >
                  Delete review
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {status ? <p className={styles.status}>{status}</p> : null}
    </section>
  );
}
