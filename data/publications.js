/**
 * Publications Data
 * haranadh.com
 */
const publicationsData = [
  {
    id: "pub-maxent-flow",
    title: "Large-Scale Evaluation of MaxEntRAG-Flow: Incremental Evidence Structures for Real-Time Context Compression and Joint Probabilistic Graph Retrieval in Long-Context LLMs",
    authors: "Haranadh G.",
    venue: "Zenodo [Preprint]",
    year: 2026,
    category: "preprint",
    tags: ["MaxEntRAG-Flow", "Context Compression", "Probabilistic Retrieval", "Long-Context LLMs"],
    abstract: "This paper applies MaxEntRAG-Flow to context compression for long-context retrieval-augmented generation. It evaluates threshold-based probabilistic retrieval across long-context benchmarks and studies context-size reduction, retrieval latency, interaction cost, and QA performance against standard RAG and compression baselines.",
    links: {
      pdf: "https://zenodo.org/records/20359087"
    }
  },
  {
    id: "pub-maxent-sparse",
    title: "Maximum Entropy Source-Anchored Sparse Retrieval with LLM-Free Indexing for Graph-Augmented RAG",
    authors: "Haranadh G.",
    venue: "Zenodo [Preprint]",
    year: 2026,
    category: "preprint",
    tags: ["MaxEntRAG", "GraphRAG", "LLM-Free Indexing", "Sparse Retrieval", "Density Paradox"],
    abstract: "This preprint presents MaxEntRAG, a Maximum Entropy based retrieval framework for Graph-Augmented Retrieval-Augmented Generation. The paper studies whether RAG systems require dense, LLM-generated knowledge graphs, or whether sparse, source-anchored retrieval structures can preserve enough relational signal for effective multi-hop and domain-specific retrieval.\n\nMaxEntRAG replaces exhaustive graph extraction with entropy-driven anchor selection. High-information lexical anchors are linked directly back to source spans, creating a compact transitive retrieval structure without using an LLM for indexing or graph construction. The method is designed to reduce graph density, indexing cost, and query latency while preserving source-grounded evidence paths.\n\nThe paper introduces and studies the Density Paradox: the observation that increasing graph density can improve retrieval only up to a point, after which additional semantic edges introduce topological noise and reduce retrieval precision. Experiments are reported on GraphRAG-Bench, HotpotQA, and MuSiQue, with comparisons against representative graph-based retrieval baselines.",
    links: {
      pdf: "https://zenodo.org/records/20354685"
    }
  },
  {
    id: "pub-thesis",
    title: "Trajectory Classification using Gaussian Process Regression",
    authors: "Haranadh G.",
    venue: "MS Thesis, Indian Institute of Technology (IIT), Madras",
    year: 2011,
    category: "publication",
    tags: ["Gaussian Process", "Trajectory Classification", "Hyperparametric Space", "IIT Madras", "MS Thesis"],
    abstract: "In this paper, we address the trajectory classification problem in Gaussian process framework without using Gaussian process based classification directly. Properties of the function corresponding to a trajectory are captured into the hyperparameters of a Gaussian process. As different trajectories have different properties, hyperparameters are different for these trajectories. In the hyperparametric space, different clusters are formed for noisy, shifted versions of the trajectories. The hyperparameters are used as features representing a trajectory and the classification task is performed in the hyperparametric space. Classification performance of the proposed method is evaluated on simulated data and also on realworld time series data.",
    links: {
      pdf: "#"
    }
  },
  {
    id: "pub-ijcnn",
    title: "Hyperparameters of Gaussian process as features for trajectory classification",
    authors: "Haranadh G., et al.",
    venue: "IEEE International Joint Conference on Neural Networks (IJCNN / WCCI 2008)",
    year: 2008,
    category: "publication",
    tags: ["Gaussian Process", "Trajectory Classification", "IJCNN", "IEEE", "Neural Networks"],
    abstract: "In this paper, we address the trajectory classification problem in Gaussian process framework without using Gaussian process based classification directly. Properties of the function corresponding to a trajectory are captured into the hyperparameters of a Gaussian process. As different trajectories have different properties, hyperparameters are different for these trajectories. In the hyperparametric space, different clusters are formed for noisy, shifted versions of the trajectories. The hyperparameters are used as features representing a trajectory and the classification task is performed in the hyperparametric space. Classification performance of the proposed method is evaluated on simulated data and also on realworld time series data.",
    links: {
      pdf: "#"
    }
  },
  {
    id: "pub-pat",
    title: "System and Method for Machine Learning-Based Automated Credit Scoring, Lending Decisions, and Fraud Risk Analytics",
    authors: "Haranadh G. (Lead Inventor / VP Data Science), et al.",
    venue: "Granted Patent - Singapore Patent Office",
    year: 2017,
    category: "patent",
    tags: ["Machine Learning", "Patent", "FinTech", "Credit Risk", "Fraud Analytics"],
    abstract: "Based on Haranadh's original solo conceptual design, this patent details a proprietary system architecture and algorithmic method for real-time automated scoring of subprime credit candidates and high-throughput lending decisions. The innovation implements isolated scorecards, dynamic behavioral classification modules, and instant fraud anomaly detection layers using ensemble gradient boosting frameworks, optimized for high-compliance multi-tenant financial platform compliance.",
    links: {
      pdf: "#"
    }
  },
  {
    id: "pub-drdo",
    title: "Soft Computing Methods and Advanced Pattern Recognition for Cryptanalysis",
    authors: "Haranadh G., et al.",
    venue: "Sponsored by DRDO SAG Labs - Indian Institute of Technology, Madras (IITM)",
    year: 2007,
    category: "publication",
    tags: ["Soft Computing", "Pattern Recognition", "Cryptanalysis", "Defense Research"],
    abstract: "Sponsored by the Scientific Analysis Group (SAG), Defence Research and Development Organisation (DRDO), this research investigates the deployment of soft computing paradigms, neural network pattern recognizers, and genetic optimization algorithms for cryptographic system analysis. It outlines the efficacy of parallel evolutionary search systems in deciphering complex, non-linear sequence boundaries.",
    links: {
      pdf: "#"
    }
  }
];
// Bind to window to share across scripts
window.publicationsData = publicationsData;
