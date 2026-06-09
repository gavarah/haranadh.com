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

  // 7.1 Interactive Blueprint Diagram and Telemetry Simulation
  const telemetryData = {
    platform: {
      "pii-shield": {
        header: "Telemetry Console • PII Shield Active",
        body: `<span class="console-green-text">[PII_FILTER]</span> Scanning incoming request payload...
<span class="console-green-text">[PII_FILTER]</span> Match found: "John Doe" (NAME) -> Redacted to "[REDACTED_NAME_1]"
<span class="console-green-text">[PII_FILTER]</span> Match found: "4532-1200-8843-9021" (CREDIT_CARD) -> Redacted to "[REDACTED_CC_1]"
<span class="console-dim-text">[STATUS]</span> Input payload sanitized. Compliance validation passed. Ready for cache evaluation.`
      },
      "cache": {
        header: "Telemetry Console • Semantic Cache Check",
        body: `<span class="console-green-text">[CACHE]</span> Query embedding generated (dim: 1536)
<span class="console-green-text">[CACHE]</span> Performing vector similarity search in Redis index...
<span class="console-green-text">[CACHE]</span> Top match cosine similarity: 0.962 (Confidence threshold: 0.92)
<span class="console-green-text">[CACHE_HIT]</span> Similar query found. Serving cached response.
<span class="console-amber-text">[METRIC]</span> Execution Latency: <span class="console-green-text">12ms</span> | Token Savings: 342 tokens.`
      },
      "router": {
        header: "Telemetry Console • Dynamic Model Routing",
        body: `<span class="console-green-text">[ROUTER]</span> Selecting optimal model route...
<span class="console-green-text">[ROUTER]</span> Task complexity: High (Structured JSON Entity Extraction)
<span class="console-green-text">[ROUTER]</span> Routing request to Claude 3.5 Sonnet (Primary Route)
<span class="console-dim-text">[LIMITS]</span> Current rate limit state: 14/100 RPM. Tokens remaining: 80,000/min.
<span class="console-dim-text">[ROUTER]</span> Dispatching payload to model endpoint...`
      },
      "auditor": {
        header: "Telemetry Console • Alignment Auditing",
        body: `<span class="console-green-text">[AUDITOR]</span> Capturing trace events for context token logs...
<span class="console-green-text">[AUDITOR]</span> Model response verified. Toxicity score: 0.01. Safety check passed.
<span class="console-green-text">[AUDITOR]</span> Archiving execution trace (prompt tokens: 512, completion: 180).
<span class="console-dim-text">[AUDITOR]</span> Writing encrypted audit packet to cold storage.
<span class="console-dim-text">[AUDITOR]</span> Pipeline completion logged successfully.`
      }
    },
    rag: {
      "query": {
        header: "Telemetry Console • Query Ingestion",
        body: `<span class="console-green-text">[INGEST]</span> Received user query: "What is our policy on client credit limits?"
<span class="console-green-text">[INGEST]</span> Tokenizing parameters and extracting entities...
<span class="console-green-text">[INGEST]</span> Entity terms identified: ["client", "credit limits", "policy"]
<span class="console-dim-text">[INGEST]</span> Initiating parallel dense, sparse, and graph retrieval tasks...`
      },
      "hybrid": {
        header: "Telemetry Console • Hybrid RRF Search",
        body: `<span class="console-green-text">[RETRIEVAL]</span> Querying Dense Vector Store (semantic match) -> 5 candidates
<span class="console-green-text">[RETRIEVAL]</span> Querying Sparse Index (exact keyword BM25) -> 5 candidates
<span class="console-green-text">[RRF]</span> Blending ranks using Reciprocal Rank Fusion (RRF)...
<span class="console-green-text">[RRF]</span> Blended top candidate node ID: doc_7718_chunk_3 (score: 0.083)
<span class="console-amber-text">[METRIC]</span> Hybrid search completed in <span class="console-green-text">32ms</span>.`
      },
      "knowledge": {
        header: "Telemetry Console • Graph Resolver",
        body: `<span class="console-green-text">[GRAPH]</span> Mapping query entities to Knowledge Graph vertices...
<span class="console-green-text">[GRAPH]</span> Subgraph matched: (Client) -[has_limit]-> (CreditPolicy)
<span class="console-green-text">[GRAPH]</span> Resolving adjacent attributes and links: ["CreditLimitUSD", "ApprovalWorkflow"]
<span class="console-dim-text">[GRAPH]</span> Fusing entity facts with standard chunk context to form enriched prompt.`
      },
      "rbac": {
        header: "Telemetry Console • Security Gate",
        body: `<span class="console-green-text">[SECURITY]</span> Verifying document ACL tokens against user roles...
<span class="console-green-text">[SECURITY]</span> User Role: "Customer_Representative" | Tenant ID: "US_EAST"
<span class="console-green-text">[SECURITY]</span> Filter evaluation:
  - doc_7718_chunk_3: <span class="console-green-text">ALLOWED</span> (Public policy documentation)
  - doc_9021_chunk_12: <span class="console-amber-text">FILTERED</span> (Requires VP level credentials)
<span class="console-dim-text">[SECURITY]</span> Document-level compliance check completed.`
      }
    }
  };

  const blueprintContainers = document.querySelectorAll(".blueprint-container");
  blueprintContainers.forEach(container => {
    container.addEventListener("click", (e) => {
      e.stopPropagation(); // Stop parent system-card from collapsing when clicking diagrams
    });

    const nodes = container.querySelectorAll(".blueprint-node");
    nodes.forEach(node => {
      node.addEventListener("click", () => {
        const system = node.getAttribute("data-system");
        const nodeKey = node.getAttribute("data-node");
        
        // Update active class on nodes
        nodes.forEach(n => n.classList.remove("active"));
        node.classList.add("active");
        
        // Update console header and body
        const headerEl = document.getElementById(`console-header-${system}`);
        const bodyEl = document.getElementById(`console-body-${system}`);
        
        if (telemetryData[system] && telemetryData[system][nodeKey]) {
          const data = telemetryData[system][nodeKey];
          if (headerEl) headerEl.textContent = data.header;
          if (bodyEl) bodyEl.innerHTML = data.body;
        }
      });
    });
  });

  // Initialize Default Telemetry View on Load
  function initTelemetry() {
    const defaultNodes = [
      { system: "platform", node: "pii-shield" },
      { system: "rag", node: "query" }
    ];
    
    defaultNodes.forEach(def => {
      const headerEl = document.getElementById(`console-header-${def.system}`);
      const bodyEl = document.getElementById(`console-body-${def.system}`);
      if (telemetryData[def.system] && telemetryData[def.system][def.node]) {
        const data = telemetryData[def.system][def.node];
        if (headerEl) headerEl.textContent = data.header;
        if (bodyEl) bodyEl.innerHTML = data.body;
      }
    });
  }

  initTelemetry();

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

  // 10. Mobile Menu Dropdown Control
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const consoleSidebar = document.querySelector(".console-sidebar");
  
  if (mobileMenuBtn && consoleSidebar) {
    const icon = mobileMenuBtn.querySelector("i");
    
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = consoleSidebar.classList.contains("menu-open");
      if (isOpen) {
        consoleSidebar.classList.remove("menu-open");
        if (icon) icon.className = "fas fa-bars";
      } else {
        consoleSidebar.classList.add("menu-open");
        if (icon) icon.className = "fas fa-times";
      }
    });

    // Close menu when clicking a link
    const sidebarLinks = consoleSidebar.querySelectorAll(".nav-links a");
    sidebarLinks.forEach(link => {
      link.addEventListener("click", () => {
        consoleSidebar.classList.remove("menu-open");
        if (icon) icon.className = "fas fa-bars";
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!consoleSidebar.contains(e.target) && consoleSidebar.classList.contains("menu-open")) {
        consoleSidebar.classList.remove("menu-open");
        if (icon) icon.className = "fas fa-bars";
      }
    });
  }

  // 9. Initial Load Rendering
  renderPublications();
  renderBlogs();
});
