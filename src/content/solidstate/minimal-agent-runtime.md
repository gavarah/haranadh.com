---
title: "Building a Minimal Agent Runtime: ReAct Loops, State Graphs, and Symbolic Chaining"
postNumber: 1
date: "May 20, 2026"
readTime: "8 min read"
tag: "Agentic Runtime"
---
<p>When I began developing a minimal agent runtime, my intention was not to replace established frameworks. Solutions such as LangChain, LangGraph, and Semantic Kernel already address many practical challenges.</p>
                
                <p style="margin-top: 16px;">These frameworks are valuable for teams requiring integrations, production patterns, observability, and ecosystem support. However, my focus was to understand the core architectural components underlying these systems.</p>
                
                <p style="margin-top: 16px;">What is the minimal structure required to run an agent safely? What essential elements must an agent runtime include before evolving into a full framework?</p>
                
                <p style="margin-top: 16px;">This article reflects that implementation process. The initial version emphasized runtime state, a non-blocking ReAct loop, state graph orchestration, and symbolic chaining. The runtime codebase is intentionally minimal to ensure the core remains easy to understand, test, and extend.</p>
                
                <p style="margin-top: 16px;">This is the first article in a five-part implementation series. The series aims to go beyond conceptual discussions by providing practical, code-focused explanations of each aspect of the runtime design. In the fifth article, I will provide a production-ready Git repository that enables readers to review the complete implementation, run it locally, and adapt it to their needs.</p>
                
                <p style="margin-top: 16px;">This first article focuses on three core patterns:</p>
                <ul style="margin-left: 24px; margin-top: 12px; margin-bottom: 24px; list-style-type: disc; display: flex; flex-direction: column; gap: 8px;">
                  <li>A non-blocking ReAct loop</li>
                  <li>A lightweight state graph for orchestration</li>
                  <li>Symbolic chaining to make pipelines readable</li>
                </ul>
                
                <p style="margin-top: 16px;">Together, these patterns form a concise yet effective foundation for agentic systems.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Core Concept: Deterministic Shell, Probabilistic Core</h3>
                <p>An agent runtime consists of two components. The probabilistic side, represented by the LLM, handles reasoning, decision-making, drafting responses, and requesting tools. The deterministic side is the runtime itself, which manages state, tool execution, approvals, retries, limits, and termination.</p>
                
                <p style="margin-top: 16px;">This separation is essential. The LLM determines the next action, while the runtime enforces what is permitted, executed, stored, and when the loop should terminate.</p>
                
                <p style="margin-top: 16px;">At its core, the runtime follows the ReAct pattern:</p>
                
                <!-- ReAct Loop Flowchart -->
                <div style="background: var(--bg-primary); padding: 24px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); margin: 32px 0; text-align: center;">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; font-family: monospace; font-size: 0.9rem; font-weight: bold; color: var(--text-primary);">
                    <div style="padding: 10px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; box-shadow: var(--shadow-sm);">Receive Input</div>
                    <div style="color: var(--accent-indigo);"><i class="fas fa-arrow-down"></i></div>
                    <div style="padding: 10px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; box-shadow: var(--shadow-sm);">Build Current State</div>
                    <div style="color: var(--accent-indigo);"><i class="fas fa-arrow-down"></i></div>
                    <div style="padding: 10px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; box-shadow: var(--shadow-sm);">Invoke Model with Available Tools</div>
                    <div style="color: var(--accent-indigo);"><i class="fas fa-arrow-down"></i></div>
                    <div style="padding: 10px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; box-shadow: var(--shadow-sm);">Parse Response &amp; Tool Calls</div>
                    <div style="color: var(--accent-indigo);"><i class="fas fa-arrow-down"></i></div>
                    <div style="padding: 10px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; box-shadow: var(--shadow-sm);">Execute Tools or Pause for Approval</div>
                    <div style="color: var(--accent-indigo);"><i class="fas fa-arrow-down"></i></div>
                    <div style="padding: 10px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; box-shadow: var(--shadow-sm);">Update State</div>
                    <div style="color: var(--accent-indigo);"><i class="fas fa-arrow-down"></i></div>
                    <div style="padding: 10px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; box-shadow: var(--shadow-sm); border-color: var(--accent-indigo);">Repeat until completed or stopped</div>
                  </div>
                </div>

                <p style="margin-top: 24px;">While this loop appears simple, it underpins many agentic systems. The key design question extends beyond whether the model can call a tool. A more important consideration is whether the system can control tool calls, maintain state, support safe recovery, and provide clear explanations of actions. This is where runtime design becomes critical.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Runtime State as the Centre of Control</h3>
                <p>The initial design decision is to make the state explicit. Rather than distributing runtime information across multiple objects, callbacks, or temporary variables, the implementation consolidates the agent run state into a single data structure.</p>

                <pre style="background-color: #141C1A; color: #d0d7d5; padding: 24px; border-radius: var(--border-radius-sm); overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; line-height: 1.5; margin: 24px 0;"><code style="font-family: inherit;">from dataclasses import dataclass, field
from typing import Any

@dataclass
class RuntimeState:
    run_id: str
    messages: list[Message]
    status: RunStatus = "running"
    tool_results: list[ToolResult] = field(default_factory=list)
    pending_approvals: list[ToolCall] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)</code></pre>

                <p style="margin-top: 24px;">Although compact, this structure provides a clear control point for the runtime. The <code>messages</code> field records conversation and tool interaction history, while the <code>status</code> field indicates whether the run is active, completed, failed, or waiting.</p>
                
                <p style="margin-top: 16px;">The <code>tool_results</code> field stores outputs from executed tools. The <code>pending_approvals</code> field enables the runtime to pause before sensitive actions. The <code>metadata</code> field offers flexibility for tracing, policy enforcement, routing, and future extensions.</p>
                
                <p style="margin-top: 16px;">This structure also simplifies testing. Tests can instantiate a <code>RuntimeState</code>, pass it to the runtime, and verify state changes directly, which is more straightforward than testing systems with deeply nested state. It also facilitates recovery. If the state can be serialised, stored, and restored, the runtime is not limited to in-memory execution. This is valuable when agents are paused, resumed, audited, or migrated across environments.</p>
                
                <p style="margin-top: 16px;">The state object serves as the single source of truth for each run, which is a valuable design discipline.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Pattern 1: The Non-Blocking ReAct Loop</h3>
                <p>The core runtime operates as an asynchronous loop with a defined step limit. Each iteration invokes the model, checks for tool calls, executes tools, updates state, and determines whether to continue or complete.</p>
                
                <p style="margin-top: 16px;">A simplified version looks like this:</p>

                <pre style="background-color: #141C1A; color: #d0d7d5; padding: 24px; border-radius: var(--border-radius-sm); overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; line-height: 1.5; margin: 24px 0;"><code style="font-family: inherit;">async def run(self, state: RuntimeState) -> RuntimeState:
    self.tracer.record(state.run_id, "run_started", {"status": state.status})
    for step in range(self.max_steps):
        # Bounded memory: trim context to prevent context window growth
        if len(state.messages) > self.max_history:
            self._trim_context(state)
        # Dynamic tool fetch: expose only tools valid for the current state
        tools = self.tool_registry.available_tools(state)
        # Model invocation with caching layer
        response = await self.model.invoke(
            messages=state.messages,
            tools=tools,
            state=state,
        )
        if response.has_tool_calls:
            # Parallel tool execution
            tool_tasks = [
                self.tool_registry.execute(tc)
                for tc in response.tool_calls
            ]
            results = await asyncio.gather(*tool_tasks)
            for result in results:
                state.tool_results.append(result)
                state.messages.append(
                    Message(
                        role="tool",
                        name=result.tool_name,
                        content=str(result.data),
                    )
                )
            continue
        # Terminal condition: model responded with final text
        state.messages.append(
            Message(role="assistant", content=response.content or "")
        )
        state.status = "completed"
        return state</code></pre>

                <p style="margin-top: 24px;">Although concise, this code addresses key runtime responsibilities. The loop is constrained by <code>max_steps</code> to prevent indefinite execution, and context is trimmed when message history exceeds set limits. The tool registry determines tool availability at each step. The model is invoked with current messages, tools, and state. If the model requests tools, they are executed and their results are incorporated into the state. If the model does not request tools, its response is treated as the final answer. This control loop ensures the runtime manages execution around the model, rather than simply relaying prompts.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">The Importance of Asynchronous Tool Execution</h3>
                <p>Tool calls are frequently I/O-bound, often involving databases, external APIs, search services, file systems, workflow systems, or internal services. When an agent requests multiple independent tools, executing them sequentially introduces unnecessary latency.</p>
                
                <p style="margin-top: 16px;">For example:</p>
                <ul style="margin-left: 24px; margin-top: 12px; margin-bottom: 24px; list-style-type: disc; display: flex; flex-direction: column; gap: 8px;">
                  <li>fetch customer profile</li>
                  <li>fetch repayment history</li>
                  <li>fetch risk policy</li>
                </ul>
                
                <p style="margin-top: 16px;">If each tool requires two seconds and they run sequentially, the runtime waits approximately six seconds. Running them in parallel reduces the wait time to that of the slowest call.</p>
                
                <p style="margin-top: 16px;">For this reason, the implementation uses:</p>
                <pre style="background-color: #141C1A; color: #d0d7d5; padding: 16px; border-radius: var(--border-radius-sm); overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; line-height: 1.5; margin: 16px 0;"><code style="font-family: inherit;">results = await asyncio.gather(*tool_tasks)</code></pre>
                
                <p style="margin-top: 16px;">While a minor design choice, this approach is significant. An agent runtime should avoid unnecessary blocking during independent I/O operations. Parallel tool execution maintains responsiveness without adding complexity. However, parallel execution should be applied judiciously. Some tools may depend on prior outputs, modify external systems, or require approval before execution. When tool calls are independent and safe to execute concurrently, asynchronous execution provides a practical performance benefit.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Pattern 2: State Graphs for Agent Handoffs</h3>
                <p>A single agent loop is effective for many tasks, but real-world workflows often require multiple steps or roles.</p>
                
                <div style="background: var(--bg-primary); padding: 16px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); margin: 24px 0; text-align: center; font-family: monospace; font-size: 0.9rem; color: var(--accent-indigo); font-weight: bold; display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap;">
                  <span>research agent</span> <i class="fas fa-arrow-right"></i>
                  <span>analysis agent</span> <i class="fas fa-arrow-right"></i>
                  <span>writer agent</span> <i class="fas fa-arrow-right"></i>
                  <span>review agent</span>
                </div>
                
                <p style="margin-top: 16px;">Or in an enterprise workflow:</p>
                
                <p style="font-family: 'Courier New', Courier, monospace; font-size: 0.82rem; color: var(--text-secondary); background: var(--bg-primary); padding: 16px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); line-height: 1.5; margin: 24px 0;">
                  retrieve policy → read customer profile → read repayment history → calculate risk indicators → draft recommendation → approval step → update internal record → notify downstream system → log outcome
                </p>
                
                <p style="margin-top: 16px;">A lightweight state graph addresses this need. The objective is not to build a complex orchestration engine, but to provide a straightforward method for passing the same RuntimeState through various nodes. Each node is an asynchronous function that receives the state and returns an updated state. The graph determines the subsequent node to execute.</p>

                <pre style="background-color: #141C1A; color: #d0d7d5; padding: 24px; border-radius: var(--border-radius-sm); overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; line-height: 1.5; margin: 24px 0;"><code style="font-family: inherit;">class StateGraph:
    def __init__(self):
        self.nodes: Dict[
            str,
            Callable[[RuntimeState], Coroutine[Any, Any, RuntimeState]]
        ] = {}
        self.edges: Dict[str, str] = {}
        self.conditional_edges: Dict[str, Callable[[RuntimeState], str]] = {}
        self.entry_point: str | None = None

    async def run(self, state: RuntimeState) -> RuntimeState:
        if not self.entry_point:
            raise ValueError("Entry point not set")
        current_node_name = self.entry_point
        while current_node_name:
            node_action = self.nodes[current_node_name]
            # Execute node logic
            state = await node_action(state)
            # Conditional edges take priority over static edges
            if current_node_name in self.conditional_edges:
                router = self.conditional_edges[current_node_name]
                current_node_name = router(state)
            else:
                current_node_name = self.edges.get(current_node_name)
            # Stop early if execution failed or was rejected
            if state.status in ["failed", "rejected"] or not current_node_name:
                break
        return state</code></pre>

                <p style="margin-top: 24px;">This graph is built on three concepts: nodes perform work, static edges define fixed transitions, and conditional edges evaluate state to select the next node dynamically. This approach is sufficient for many practical workflows.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">The Value of the Router</h3>
                <p>The router enables powerful state-aware orchestration. Each node focuses solely on its task and updating the state, without needing awareness of subsequent steps. The graph then inspects the state to determine the next step.</p>
                
                <p style="margin-top: 16px;">For example, after calculating a credit risk score:</p>
                <ul style="margin-left: 24px; margin-top: 12px; margin-bottom: 24px; list-style-type: disc; display: flex; flex-direction: column; gap: 8px;">
                  <li><strong>low risk</strong> → continue to automated approval</li>
                  <li><strong>medium risk</strong> → send to manual review</li>
                  <li><strong>high risk</strong> → reject or escalate</li>
                </ul>
                
                <p style="margin-top: 16px;">This approach keeps node logic clean. The agent or function responsible for risk calculation only updates the state, while the graph manages flow control. This separation simplifies future changes. If routing logic evolves, only the graph router requires modification, not the individual nodes. For this reason, I prefer to keep orchestration outside the agent node. The agent should focus on its responsibilities, while the graph manages workflow progression.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Pattern 3: Symbolic Chaining for Readability</h3>
                <p>Runtime code should remain understandable. Excessive wiring code in workflows increases maintenance complexity. To improve readability of simple pipelines, the implementation uses symbolic chaining with the <code>&gt;&gt;</code> operator, achieved in Python by overloading <code>__rshift__</code>.</p>

                <pre style="background-color: #141C1A; color: #d0d7d5; padding: 24px; border-radius: var(--border-radius-sm); overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; line-height: 1.5; margin: 24px 0;"><code style="font-family: inherit;">def __rshift__(self, other):
    \"\"\"Allows syntax like: agent1 &gt;&gt; agent2\"\"\"
    from solidstate.graph import StateGraph
    graph = StateGraph()
    graph.add_node(self.name, self.run)
    graph.set_entry_point(self.name)
    if isinstance(other, AgentRuntime):
        graph.add_node(other.name, other.run)
        graph.add_edge(self.name, other.name)
        return graph
    return graph</code></pre>

                <p style="margin-top: 24px;">This allows a workflow to be written like this:</p>
                <pre style="background-color: #141C1A; color: #d0d7d5; padding: 16px; border-radius: var(--border-radius-sm); overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; line-height: 1.5; margin: 16px 0;"><code style="font-family: inherit;">researcher = AgentRuntime(name="Researcher", ...)
writer = AgentRuntime(name="Writer", ...)
publisher = AgentRuntime(name="Publisher", ...)

publishing_pipeline = researcher &gt;&gt; writer &gt;&gt; publisher
final_state = await publishing_pipeline.run(initial_state)</code></pre>
                
                <p style="margin-top: 24px;">While this feature does not add runtime capabilities, it enhances readability. The pipeline is visible in a single line, which aids in reviewing, discussing, and modifying workflows. Symbolic chaining should be applied judiciously. It is most effective for simple, linear flows; complex workflows are better served by explicit graph definitions. The goal is not to introduce unnecessary complexity, but to make common patterns easier to express.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">A Minimal Runtime Still Requires Boundaries</h3>
                <p>Even a minimal runtime requires clear boundaries. An unrestricted agent loop can be risky, as the model may continue reasoning indefinitely, repeatedly call tools, generate unexpected requests, or exceed token limits. For this reason, the runtime incorporates several fundamental controls from the outset:</p>
                <ul style="margin-left: 24px; margin-top: 12px; margin-bottom: 24px; list-style-type: disc; display: flex; flex-direction: column; gap: 8px;">
                  <li>maximum steps</li>
                  <li>context trimming</li>
                  <li>tool availability checks</li>
                  <li>runtime status</li>
                  <li>approval state</li>
                  <li>trace recording</li>
                </ul>
                <p style="margin-top: 16px;">These are not advanced enterprise features, but essential runtime responsibilities. Without them, the agent is merely a model call within a loop. With these controls, the runtime functions as a controlled execution environment. While the model provides intelligence, reliability is ensured by the surrounding runtime.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Scope Limitations of This Runtime</h3>
                <p>This runtime is intentionally minimal and does not attempt to address every production concern from the outset. A complete production-grade agent platform may need persistence, distributed execution, observability dashboards, advanced policy enforcement, human approval queues, retries, rate limits, cost controls, tenant isolation, and deployment tooling. These features are important, but can be integrated around a well-defined runtime core. The initial priority is to ensure the execution model is clear and understandable. Once the core loop, state model, tool execution, and graph routing are well-defined, the broader system gains a stronger foundation.</p>
                <p style="margin-top: 16px;">For this reason, the series remains implementation-focused. Rather than beginning with high-level architecture diagrams, it starts with the code path and builds outward.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Significance of This Approach</h3>
                <p>Many agent projects become difficult to manage due to unclear control structures. The model makes decisions, tools are called, and state changes occur without transparency. Callbacks update other objects, retries occur, and additional agents may take over. After several layers, it becomes challenging to answer basic questions:</p>
                <ul style="margin-left: 24px; margin-top: 12px; margin-bottom: 24px; list-style-type: disc; display: flex; flex-direction: column; gap: 8px;">
                  <li>What happened?</li>
                  <li>Why did it happen?</li>
                  <li>Which tool was called?</li>
                  <li>What state changed?</li>
                  <li>Can we replay this?</li>
                  <li>Can we pause before this action?</li>
                  <li>Can we recover from here?</li>
                </ul>
                <p style="margin-top: 16px;">A runtime should simplify answering these questions. This is why the design emphasizes explicit state, bounded loops, controlled tool execution, and graph-based routing. The model may remain flexible, but the runtime must maintain discipline.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Conclusion</h3>
                <p>Developing an agent runtime does not require a large framework. It can begin with a concise set of clear patterns:</p>
                <ul style="margin-left: 24px; margin-top: 12px; margin-bottom: 24px; list-style-type: disc; display: flex; flex-direction: column; gap: 8px;">
                  <li>A <code>RuntimeState</code> that captures the run</li>
                  <li>A bounded ReAct loop that invokes the model and executes tools</li>
                  <li>Async tool execution for better latency</li>
                  <li>A state graph for multi-step orchestration</li>
                  <li>Symbolic chaining for readable pipelines</li>
                </ul>
                <p style="margin-top: 16px;">This approach provides a practical foundation for agentic execution while maintaining transparency in control flow.</p>
                <p style="margin-top: 16px;">This is only the first part of the five-part implementation series. In the next article, I will go deeper into the runtime's external interface: dynamic tool registries and automatic schema synthesis. By the fifth article, I will integrate all components and share a production-ready Git repository containing the complete implementation. At that stage, plain Python functions evolve into structured agent tools, and the runtime connects with external systems in a controlled manner.</p>
