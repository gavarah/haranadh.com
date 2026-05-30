/**
 * Main Application Logic & Interactivity
 * haranadh.com
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Data Retrieval
  const publications = window.publicationsData || [];
  const blogs = window.blogsData || [];

  // 2. DOM Elements
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll("section");
  const publicationsContainer = document.getElementById("publications-grid");
  const blogsContainer = document.getElementById("blogs-grid");
  const pubFilterButtons = document.querySelectorAll(".pub-filter-btn");
  const blogSearchInput = document.getElementById("blog-search");
  
  // Modals
  const blogModal = document.getElementById("blog-modal");
  const blogModalContent = document.getElementById("blog-modal-body");
  const blogModalTitle = document.getElementById("blog-modal-title");
  const blogModalMeta = document.getElementById("blog-modal-meta");
  const modalCloseBtn = document.querySelector(".modal-close");

  // Email copying
  const emailBtn = document.getElementById("email-btn");
  const emailAddress = "harrygavara@gmail.com"; // Placed here, can be updated by user

  // 3. Navigation Intersection Observer (Active highlighting)
  const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -60% 0px", // Focus in the middle area
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeId = entry.target.getAttribute("id");
        navLinks.forEach(link => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${activeId}`) {
            link.classList.add("active");
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => navObserver.observe(section));

  // 4. Render Publications
  function renderPublications(filter = "all") {
    if (!publicationsContainer) return;
    publicationsContainer.innerHTML = "";

    const filtered = filter === "all" 
      ? publications 
      : publications.filter(pub => pub.category === filter);

    if (filtered.length === 0) {
      publicationsContainer.innerHTML = `<div class="empty-state">No publications found in this category.</div>`;
      return;
    }

    filtered.forEach((pub, index) => {
      const card = document.createElement("div");
      card.className = "publication-card glass-card";
      card.style.animationDelay = `${index * 80}ms`;

      // Build links
      let linksHtml = "";
      if (pub.links) {
        if (pub.links.arxiv) linksHtml += `<a href="${pub.links.arxiv}" target="_blank" rel="noopener noreferrer" class="pub-link"><i class="fas fa-file-alt"></i> arXiv</a>`;
        if (pub.links.pdf) linksHtml += `<a href="${pub.links.pdf}" target="_blank" rel="noopener noreferrer" class="pub-link"><i class="fas fa-file-pdf"></i> PDF</a>`;
        if (pub.links.github) linksHtml += `<a href="${pub.links.github}" target="_blank" rel="noopener noreferrer" class="pub-link"><i class="fab fa-github"></i> Code</a>`;
      }

      // Build tags
      const tagsHtml = pub.tags ? pub.tags.map(tag => `<span class="card-tag">${tag}</span>`).join("") : "";

      card.innerHTML = `
        <div class="pub-header">
          <span class="pub-venue">${pub.venue} • ${pub.year}</span>
          <h3 class="pub-title">${pub.title}</h3>
          <p class="pub-authors">${pub.authors}</p>
        </div>
        <div class="pub-body">
          <p class="pub-abstract collapsed" id="abstract-${pub.id}">${pub.abstract}</p>
          <button class="toggle-abstract-btn" data-id="${pub.id}">Read Abstract <i class="fas fa-chevron-down"></i></button>
        </div>
        <div class="pub-tags-row">
          ${tagsHtml}
        </div>
        <div class="pub-footer-links">
          ${linksHtml}
        </div>
      `;

      publicationsContainer.appendChild(card);
    });

    // Wire up abstract toggles
    document.querySelectorAll(".toggle-abstract-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = btn.getAttribute("data-id");
        const abstractEl = document.getElementById(`abstract-${id}`);
        const isCollapsed = abstractEl.classList.contains("collapsed");

        if (isCollapsed) {
          abstractEl.classList.remove("collapsed");
          btn.innerHTML = `Hide Abstract <i class="fas fa-chevron-up"></i>`;
          btn.classList.add("expanded");
        } else {
          abstractEl.classList.add("collapsed");
          btn.innerHTML = `Read Abstract <i class="fas fa-chevron-down"></i>`;
          btn.classList.remove("expanded");
        }
      });
    });
  }

  // Publication filter wire-up
  pubFilterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      pubFilterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderPublications(btn.getAttribute("data-filter"));
    });
  });

  // 5. Render Blogs
  function renderBlogs(searchTerm = "") {
    if (!blogsContainer) return;
    blogsContainer.innerHTML = "";

    const term = searchTerm.toLowerCase().trim();
    const filtered = blogs.filter(blog => {
      const matchTitle = blog.title.toLowerCase().includes(term);
      const matchExcerpt = blog.excerpt.toLowerCase().includes(term);
      const matchTags = blog.tags.some(tag => tag.toLowerCase().includes(term));
      return matchTitle || matchExcerpt || matchTags;
    });

    if (filtered.length === 0) {
      blogsContainer.innerHTML = `<div class="empty-state">No articles match your search.</div>`;
      return;
    }

    // Check for limit attribute
    const limitAttr = blogsContainer.getAttribute("data-limit");
    const limit = limitAttr ? parseInt(limitAttr, 10) : null;
    const displayBlogs = limit ? filtered.slice(0, limit) : filtered;

    displayBlogs.forEach((blog, index) => {
      const card = document.createElement("div");
      card.className = `blog-card glass-card ${blog.featured ? 'featured' : ''}`;
      card.style.animationDelay = `${index * 80}ms`;

      const tagsHtml = blog.tags.map(tag => `<span class="card-tag">${tag}</span>`).join("");

      card.innerHTML = `
        <div class="blog-meta-row">
          <span class="blog-date">${blog.date}</span>
          <span class="blog-read-time">${blog.readTime}</span>
        </div>
        <h3 class="blog-title">${blog.title}</h3>
        <p class="blog-excerpt">${blog.excerpt}</p>
        <div class="blog-footer">
          <div class="blog-tags">${tagsHtml}</div>
          <button class="read-blog-btn btn-text" data-id="${blog.id}">Read Essay <i class="fas fa-arrow-right"></i></button>
        </div>
      `;

      blogsContainer.appendChild(card);
    });

    // Wire up blog modal triggers
    document.querySelectorAll(".read-blog-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const blogId = btn.getAttribute("data-id");
        openBlogModal(blogId);
      });
    });
  }

  // Blog Search Input
  if (blogSearchInput) {
    blogSearchInput.addEventListener("input", (e) => {
      renderBlogs(e.target.value);
    });
  }

  // 6. Blog Modal Control
  function openBlogModal(blogId) {
    const blog = blogs.find(b => b.id === blogId);
    if (!blog || !blogModal) return;

    blogModalTitle.textContent = blog.title;
    blogModalMeta.innerHTML = `<span class="modal-date">${blog.date}</span> • <span class="modal-read-time">${blog.readTime}</span>`;
    blogModalContent.innerHTML = blog.content;

    blogModal.classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent body scroll
  }

  function closeBlogModal() {
    if (!blogModal) return;
    blogModal.classList.remove("active");
    document.body.style.overflow = ""; // Re-enable scroll
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeBlogModal);
  }

  if (blogModal) {
    // Close on background click
    blogModal.addEventListener("click", (e) => {
      if (e.target === blogModal) {
        closeBlogModal();
      }
    });
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && blogModal && blogModal.classList.contains("active")) {
      closeBlogModal();
    }
  });

  // 7. Interactive System Architecture Cards
  const systemCards = document.querySelectorAll(".system-card");
  systemCards.forEach(card => {
    card.addEventListener("click", () => {
      // Toggle expanded system layout summary
      const detailedText = card.querySelector(".system-detailed-info");
      const icon = card.querySelector(".system-expand-icon i");
      
      if (detailedText) {
        const isCollapsed = detailedText.classList.contains("collapsed");
        if (isCollapsed) {
          detailedText.classList.remove("collapsed");
          card.classList.add("expanded");
          if (icon) {
            icon.className = "fas fa-minus";
          }
        } else {
          detailedText.classList.add("collapsed");
          card.classList.remove("expanded");
          if (icon) {
            icon.className = "fas fa-plus";
          }
        }
      }
    });
  });

  // 8. Contact Interaction (Email Copy)
  if (emailBtn) {
    emailBtn.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Attempt clip copy
      navigator.clipboard.writeText(emailAddress).then(() => {
        const originalText = emailBtn.innerHTML;
        emailBtn.innerHTML = `<i class="fas fa-check"></i> Email Copied!`;
        emailBtn.classList.add("success");
        
        setTimeout(() => {
          emailBtn.innerHTML = originalText;
          emailBtn.classList.remove("success");
        }, 2000);
      }).catch(err => {
        // Fallback: direct mailto link
        window.location.href = `mailto:${emailAddress}`;
      });
    });
  }

  // 9. Initial Load Rendering
  renderPublications();
  renderBlogs();
});
