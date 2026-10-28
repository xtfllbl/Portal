(function () {
  'use strict';
  // The same roving-focus tree interaction is used by Agent List and Billing.
  window.PaywizardHierarchyTree = {
    bind(node, options) {
      node.addEventListener('focusin', event => {
        const row = event.target.closest('[role="treeitem"]');
        if (row) Array.from(node.children).forEach(item => { item.tabIndex = item === row ? 0 : -1; });
      });
      node.addEventListener('keydown', event => {
        const row = event.target.closest('[role="treeitem"]');
        if (!row) return;
        const rows = Array.from(node.children), index = rows.indexOf(row), id = row.dataset.id;
        let target;
        if (event.key === 'ArrowDown') target = rows[Math.min(index + 1, rows.length - 1)];
        else if (event.key === 'ArrowUp') target = rows[Math.max(index - 1, 0)];
        else if (event.key === 'Home') target = rows[0];
        else if (event.key === 'End') target = rows[rows.length - 1];
        else if (event.key === 'ArrowRight') {
          if (row.getAttribute('aria-expanded') === 'false') options.expand?.(id, true);
          else if (row.hasAttribute('aria-expanded')) target = rows[index + 1];
        } else if (event.key === 'ArrowLeft') {
          if (row.getAttribute('aria-expanded') === 'true' && !options.searching?.()) options.expand?.(id, false);
          else target = rows.find(item => item.dataset.id === options.parent?.(id));
        } else if (event.key === 'Enter' || event.key === ' ') options.select(id);
        else return;
        event.preventDefault();
        if (target) { rows.forEach(item => { item.tabIndex = -1; }); target.tabIndex = 0; target.focus(); }
      });
    }
  };
})();
