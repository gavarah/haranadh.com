---
title: "The Guardian at the Gate: Policy Evaluation, Intercepts, and Human-in-the-Loop Orchestration"
postNumber: 3
date: "June 5, 2026"
readTime: "8 min read"
tag: "AI Safety"
---
<p>Giving an AI agent access to tools is powerful, but it also creates a new class of enterprise risk. An agent that can read documents is useful. An agent that can call APIs, update systems, or trigger workflows can create real business value.</p>
                <p style="margin-top: 16px;">But once an agent can act, mistakes become more serious. A wrong answer is one problem. A wrong action is another.</p>
                <p style="margin-top: 16px;">A similar situation came up recently in a workplace context. The exact details were different, but the failure mode was the same. An automated process was trying to “fix” or “clean up” a system condition, and its action path created a risk that was much larger than the original issue.</p>
                <p style="margin-top: 16px;">That is the real concern with agentic systems. If an agent is asked to “fix database performance issues,” the model may decide to call something like <code>drop_table("users")</code> because it reasons that empty tables are faster to search. The example is deliberately extreme, but the architectural point is practical.</p>
                <p style="margin-top: 16px;">That is no longer just a hallucination. That is an operational incident.</p>
                <p style="margin-top: 16px;">This is the key shift in agentic AI. Traditional AI systems were generally more risk-averse because they mostly produced outputs for humans or downstream systems to review. Agentic AI is different because it can reason, select tools, and execute actions.</p>
                <p style="margin-top: 16px;">So the answer is not to avoid agentic AI. The answer is to control it through an enterprise architecture framework. The model can propose actions, but the execution environment must enforce boundaries, approvals, audit, and recovery.</p>
                <p style="margin-top: 16px;">Before we jump into the implementation, it is useful to step back and look at the enterprise architecture problem.</p>
                <p style="margin-top: 16px;">Agentic AI is not only a model capability shift. It is an execution boundary shift. Traditional AI systems were usually advisory. They predicted, classified, summarized, recommended, or generated content.</p>
                <p style="margin-top: 16px;">Even when the output was wrong, the damage was often limited because a human or downstream process still had a chance to review it. Agentic AI changes that assumption.</p>
                <p style="margin-top: 16px;">An agent can reason, select a tool, call an API, update a record, trigger a workflow, or change the state of a system. Once that happens, the risk is no longer only about response quality. It becomes operational risk.</p>
                <p style="margin-top: 16px;">This is why enterprise AI cannot be governed only through prompts. A prompt can describe expected behaviour, but it cannot be the final control boundary. In an enterprise environment, control must sit in the architecture.</p>
                <p style="margin-top: 16px;">This is the same argument we discussed earlier in the context of bounded agentic AI. Autonomy without boundaries is not suitable for enterprise adoption. Agents need defined execution limits, approval gates, audit trails, recovery paths, and clear accountability.</p>
                <p style="margin-top: 16px;">In other words, agentic AI needs a control plane.</p>
                <p style="margin-top: 16px;">But the control plane should not remain only at the level of strategy, principles, or diagrams. It has to appear in the runtime. It has to sit between model reasoning and system execution.</p>
                <p style="margin-top: 16px;">The model can propose an action. The runtime must decide whether that action is allowed, rejected, or paused for human approval.</p>
                <p style="margin-top: 16px;">That is the bridge from enterprise AI architecture to implementation.</p>
                <p style="margin-top: 16px;">In this article, we’ll examine how SolidState structures tool safety using the Interceptor Pattern, Chain of Responsibility Pattern, and Stateful Asynchronous Interrupts to build human-in-the-loop mechanics.</p>
                <p style="margin-top: 16px;">These are not random implementation details. They are runtime expressions of the same enterprise control-plane idea.</p>
                <p style="margin-top: 16px;">The Interceptor Pattern is commonly used in middleware and distributed systems to add services around execution without changing the core component directly. In SolidState, the same idea is applied to tool calls. Before a tool call reaches the executor, it is intercepted by the policy layer.</p>
                <p style="margin-top: 16px;">The Chain of Responsibility Pattern comes from classic object-oriented design. It allows a request to pass through a sequence of handlers, where each handler can either process the request or pass it onward. In SolidState, this maps naturally to modular security and governance rules.</p>
                <p style="margin-top: 16px;">Stateful Asynchronous Interrupts are closer to enterprise workflow and orchestration patterns. When execution needs human approval, the runtime should not block a thread. It should persist state, pause execution, release resources, and resume later through a controlled handshake.</p>
                <p style="margin-top: 16px;">Together, these patterns turn agent safety into an architectural control plane. They move governance away from prompt wording and into runtime enforcement.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Pattern 1: The Interceptor Pattern</h3>
                <p>In web development, middleware inspects, modifies, or rejects HTTP requests before they reach the route handler. Agent runtimes can use the same idea for tool calls.</p>
                <p style="margin-top: 16px;">Before the runtime executes any <code>ToolCall</code>, it passes the call through a <code>PolicyEvaluator</code>.</p>
                <p style="margin-top: 16px;">The important point is simple. The model does not directly execute tools. It proposes tool calls. The runtime intercepts them, and the policy layer decides what happens next.</p>
                <p style="margin-top: 16px;">A policy decision can produce three outcomes:</p>
                <ul style="margin-left: 24px; margin-top: 12px; margin-bottom: 24px; list-style-type: disc; display: flex; flex-direction: column; gap: 8px;">
                  <li><code>allow</code>: means the tool call is safe enough to execute immediately.</li>
                  <li><code>reject</code>: means the tool call violates a hard boundary. The runtime cancels the action, records the refusal, and stops or raises an exception.</li>
                  <li><code>interrupt</code>: means the tool call may be valid, but it carries risk. The agent pauses, the state is saved, and a human must approve before execution continues.</li>
                </ul>
                <p style="margin-top: 16px;">This gives the runtime a clear safety model. Not every risky action has to be blocked. Not every action needs manual review. Not every rule belongs in the prompt.</p>
                <p style="margin-top: 16px;">The runtime can apply a policy based on risk.</p>

                <pre style="background-color: #141C1A; color: #d0d7d5; padding: 24px; border-radius: var(--border-radius-sm); overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; line-height: 1.5; margin: 24px 0;"><code style="font-family: inherit;">class PolicyEvaluator:
    def evaluate(self, tool_call: ToolCall, state: RuntimeState, tool_registry) -> PolicyDecision:
        tool = tool_registry.get(tool_call.name)

        # 1. Hard Rules: Block critical operations outright
        if tool.risk_level == "critical":
            return PolicyDecision("reject", "Critical tool is blocked by default policy")

        # 2. Configured Controls: Flag high-risk tools for manual review
        if tool.requires_approval:
            return PolicyDecision("interrupt", "Tool requires human approval")

        # 3. Dynamic Thresholds: Inspect the actual parameters
        amount = tool_call.args.get("amount") or tool_call.args.get("new_limit") or 0
        if isinstance(amount, (int, float)) and amount > 10000:
            return PolicyDecision("interrupt", f"Transaction amount (${amount}) exceeds auto-execution limit")

        return PolicyDecision("allow", "Tool call allowed")</code></pre>

                <p style="margin-top: 24px;">This is a small piece of code, but architecturally it does something important. It separates intention from execution.</p>
                <p style="margin-top: 16px;">The LLM may intend to call a tool. The runtime decides whether that tool call can proceed. That is the boundary enterprise AI systems need.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Pattern 2: Integrating Interceptors into the Runtime Loop</h3>
                <p>The interceptor only works if the runtime loop treats policy evaluation as mandatory. Policy evaluation happens after the model outputs tool calls and before those calls are sent to the ToolExecutor.</p>

                <pre style="background-color: #141C1A; color: #d0d7d5; padding: 24px; border-radius: var(--border-radius-sm); overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; line-height: 1.5; margin: 24px 0;"><code style="font-family: inherit;"># Inside AgentRuntime.run
if response.has_tool_calls:
    for tool_call in response.tool_calls:
        # Intercept tool call
        decision = self.policy.evaluate(tool_call, state, self.tool_registry)

        if decision.action == "reject":
            # Append rejection notice to messages so the LLM knows why it failed
            state.messages.append(
                Message(role="assistant", content=f"Tool call rejected: {decision.reason}")
            )
            state.status = "rejected"
            await self.checkpointer.save(state)
            return state # Exit early

        if decision.action == "interrupt":
            state.status = "paused"
            state.pending_approvals.append(tool_call)

    if state.status == "paused":
        # Stateful Pause: Save state immediately and return to release the thread
        await self.checkpointer.save(state)
        return state</code></pre>

                <p style="margin-top: 24px;">This control loop captures a major production principle. The runtime must behave like a gatekeeper, not like a blind executor.</p>
                <p style="margin-top: 16px;">If a tool call is rejected, the rejection is written back into the agent state. That matters because the model receives a structured signal explaining why the action failed.</p>
                <p style="margin-top: 16px;">If a tool call requires approval, the runtime does not block the process. It marks the state as paused, stores the pending approval, checkpoints the state, and returns.</p>
                <p style="margin-top: 16px;">That last step is critical.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Why Stateful Interrupts Matter</h3>
                <p>A common anti-pattern in early agent code is this:</p>
                <pre style="background-color: #141C1A; color: #d0d7d5; padding: 16px; border-radius: var(--border-radius-sm); overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; line-height: 1.5; margin: 16px 0;"><code style="font-family: inherit;">input("Approve tool call? Y/N")</code></pre>
                <p style="margin-top: 16px;">That may work in a demo. It does not work in production.</p>
                <p style="margin-top: 16px;">In a SaaS backend, Slack bot, workflow engine, or distributed application, blocking a thread while waiting for a human is dangerous. The human may respond in five seconds, five hours, or never.</p>
                <p style="margin-top: 16px;">The client connection may disconnect. The server may restart. The process may be rescheduled.</p>
                <p style="margin-top: 16px;">A production AI runtime cannot depend on an in-memory blocking loop. Human approval must be treated as an asynchronous workflow.</p>
                <p style="margin-top: 16px;">When a tool call requires approval, the runtime saves the current state with a status of paused. Then it returns immediately. The agent effectively dies in memory, but its execution context is preserved in durable storage.</p>
                <p style="margin-top: 16px;">This is similar to enterprise workflow systems. A loan approval does not keep a server thread alive while waiting for a manager. A procurement workflow does not block the application until finance responds.</p>
                <p style="margin-top: 16px;">The workflow persists state, waits externally, and resumes when a decision arrives. Agent runtimes need the same pattern.</p>
                <p style="margin-top: 16px;">This is not only a safety feature. It is an enterprise architecture feature.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Pattern 3: The Resume Handshake</h3>
                <p>Once an agent is paused, it needs a secure way to wake up. That is the resume handshake.</p>
                <p style="margin-top: 16px;">A human may review the pending tool call through a Slack button, web portal, admin console, or API. Once the decision is submitted, the runtime resumes the agent from its checkpointed state.</p>

                <pre style="background-color: #141C1A; color: #d0d7d5; padding: 24px; border-radius: var(--border-radius-sm); overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; line-height: 1.5; margin: 24px 0;"><code style="font-family: inherit;">async def resume_after_approval(self, run_id: str, approved: bool) -> RuntimeState:
    # 1. Reconstruct: Load state from checkpointer
    state = await self.checkpointer.load(run_id)

    if not state.pending_approvals:
        raise ValueError("No pending approvals found for this run")

    self.tracer.record(
        state.run_id,
        "approval_decision",
        {"approved": approved, "tool_calls": [tc.__dict__ for tc in state.pending_approvals]}
    )

    if not approved:
        # Human rejected: Record rejection and close the loop
        state.status = "rejected"
        state.messages.append(Message(role="assistant", content="Approval rejected by administrator."))
        state.pending_approvals = []
        await self.checkpointer.save(state)
        return state

    # Human approved: Move pending calls to active and execute
    tool_calls = state.pending_approvals
    state.pending_approvals = []
    state.status = "running"

    for tool_call in tool_calls:
        result = await self.tool_registry.execute(tool_call)
        state.tool_results.append(result)
        state.messages.append(
            Message(
                role="tool",
                name=tool_call.name,
                content=str(result.data if result.status == "success" else result.error),
            )
        )

    # 2. Persist Progress: Save state checkpoint
    await self.checkpointer.save(state)

    # 3. Continue Loop: Re-enter the primary execution loop
    return await self.run(state)</code></pre>

                <p style="margin-top: 24px;">This handshake does three important things. First, it reconstructs the agent state from persistent storage. Second, it records the approval decision for auditability. Third, it either rejects the action or executes the approved tool calls.</p>
                <p style="margin-top: 16px;">After that, the agent continues its run.</p>
                <p style="margin-top: 16px;">This creates a clean separation between model reasoning, policy evaluation, human approval, tool execution, state persistence, and audit tracing.</p>
                <p style="margin-top: 16px;">That separation matters in enterprise AI. Once agents interact with real systems, every action needs to be explainable.</p>
                <p style="margin-top: 16px;">Who approved it? What was approved? What parameters were used? What did the tool return? What state did the agent continue from?</p>
                <p style="margin-top: 16px;">These are not minor implementation details. They are governance requirements.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Designing Governance with the Chain of Responsibility</h3>
                <p>The first version of a policy evaluator may start with simple checks. Block critical tools, require approval for high-risk tools, and interrupt large transactions.</p>
                <p style="margin-top: 16px;">But enterprise policy rarely stays simple.</p>
                <p style="margin-top: 16px;">Different teams may need different rules. Different tools may carry different risks. Different environments may have different thresholds. Different users may have different approval limits.</p>
                <p style="margin-top: 16px;">Hardcoding all of that into one large PolicyEvaluator becomes messy. This is where the Chain of Responsibility Pattern helps.</p>
                <p style="margin-top: 16px;">Instead of one monolithic evaluator, the runtime can maintain a list of security rules. Each rule checks the tool call. It either returns a decision or passes control to the next rule.</p>

                <pre style="background-color: #141C1A; color: #d0d7d5; padding: 24px; border-radius: var(--border-radius-sm); overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; line-height: 1.5; margin: 24px 0;"><code style="font-family: inherit;">class SecurityRule(ABC):
    @abstractmethod
    def validate(self, tool_call: ToolCall, state: RuntimeState) -> PolicyDecision | None:
        pass

class BlacklistRule(SecurityRule):
    def validate(self, tool_call: ToolCall, state: RuntimeState):
        if tool_call.name in ["delete_user", "format_disk"]:
            return PolicyDecision("reject", "Banned system command")
        return None

class BudgetRule(SecurityRule):
    def validate(self, tool_call: ToolCall, state: RuntimeState):
        cost = tool_call.args.get("cost", 0)
        if cost > 500:
            return PolicyDecision("interrupt", "Cost requires budget-holder review")
        return None</code></pre>

                <p style="margin-top: 24px;">The evaluator chains through these rules. The first rule is to return a winning decision. This keeps policy modular.</p>
                <p style="margin-top: 16px;">A security team can own blacklist rules. A finance team can own budget rules. A data governance team can own sensitive data rules. A platform team can own runtime-level safety rules.</p>
                <p style="margin-top: 16px;">This is the enterprise architecture parallel. A good AI runtime should not bury governance inside prompts. It should not scatter safety logic across tool code.</p>
                <p style="margin-top: 16px;">It should expose governance as a composable policy layer.</p>
                <p style="margin-top: 16px;">This distinction matters because many current agent frameworks focus heavily on model orchestration, tool registration, memory, and workflow composition. Those are important, but they do not automatically solve runtime governance.</p>
                <p style="margin-top: 16px;">A framework may allow tools to be registered, but that does not mean every tool call is policy-mediated. A framework may support callbacks or middleware, but that does not mean it has a clear enterprise approval model.</p>
                <p style="margin-top: 16px;">A framework may log events, but logging after execution is not the same as preventing unsafe execution.</p>
                <p style="margin-top: 16px;">SolidState addresses this gap directly. Tool calls are not treated as simple function calls. They are treated as governed execution requests.</p>
                <p style="margin-top: 16px;">That is why the policy evaluator sits between the model and the tool executor. That is why high-risk actions can be interrupted. That is why the state is checkpointed before waiting for human approval.</p>
                <p style="margin-top: 16px;">That is also why the resume handshake is explicit rather than hidden inside an ad hoc callback.</p>
                <p style="margin-top: 16px;">This is not just implementation hygiene. It is the difference between an agent that can call tools and an agent runtime that can operate safely inside an enterprise.</p>

                <h3 style="color: var(--text-primary); font-size: 1.4rem; margin: 40px 0 16px 0; font-weight: 700; border-left: 3px solid var(--accent-indigo); padding-left: 12px;">Safety Is a First-Class Architecture Concern</h3>
                <p>Safety is not an afterthought. It is not solved by adding “please do not delete tables” to the system prompt. It must be designed into the runtime.</p>
                <p style="margin-top: 16px;">Placing interceptors before tool execution makes the runtime safer. By validating tool parameters, it becomes more controlled. Converting blocking approvals into stateful interrupts makes it production-ready.</p>
                <p style="margin-top: 16px;">By using a secure resume handshake, the agent becomes auditable and resilient. It can still reason, act, and complete useful workflows, but it acts within controlled boundaries.</p>
                <p style="margin-top: 16px;">That is the real foundation for enterprise-grade agentic AI. Not just better prompts. Not just better models. A better execution architecture.</p>
                <p style="margin-top: 16px;">In the next article, “Time Travel &amp; Memory: Persistence Engines, State Checkpointing, and Event Sourcing,” we will look at how agents survive server crashes, client disconnects, and long-running workflows by saving, loading, and auditing state across distributed backends such as Redis and AWS DynamoDB.</p>

                <!-- References -->
                <div style="margin-top: 40px; border-top: 1px solid var(--border-color); padding-top: 24px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                  <h4 style="font-weight: 700; color: var(--text-secondary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">References</h4>
                  <ul style="list-style-type: decimal; margin-left: 20px; display: flex; flex-direction: column; gap: 8px;">
                    <li>Schmidt, D., Stal, M., Rohnert, H., &amp; Buschmann, F. <em>Pattern-Oriented Software Architecture, Volume 2: Patterns for Concurrent and Networked Objects</em>. Used here for the Interceptor Pattern lineage.</li>
                    <li>Gamma, E., Helm, R., Johnson, R., &amp; Vlissides, J. <em>Design Patterns: Elements of Reusable Object-Oriented Software</em>. Used here for the Chain of Responsibility Pattern lineage.</li>
                    <li>Durable workflow and human-in-the-loop orchestration practices. Used here to relate stateful pause, durable execution, and resume workflows to production AI agent runtimes.</li>
                  </ul>
                </div>
