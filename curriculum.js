(function (root) {
  'use strict';
  // Only subjects belonging to this curriculum contribute to its progress.
  function summarize(subjects, states = {}) {
    const ids = [...new Set(subjects.map(subject => subject.id))];
    const approved = ids.filter(id => states[id] === 'aprobada').length;
    const inProgress = ids.filter(id => states[id] === 'en-curso').length;
    return { total: ids.length, approved, inProgress, pending: ids.length - approved - inProgress, percent: ids.length ? Math.round(approved / ids.length * 100) : 0 };
  }
  root.AdeCurriculum = Object.freeze({ summarize });
})(globalThis);
