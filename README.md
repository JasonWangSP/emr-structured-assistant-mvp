# EMR Structured Assistant (MVP)
# 病历结构化助理（MVP）

> AI-assisted system for converting raw clinical conversations into structured EMR drafts  
> 基于 AI 的临床对话 → 结构化电子病历草稿系统  
>  
> Status: MVP (functional, iterative)  
> 当前状态：MVP（可运行 · 持续迭代）

---

## Overview | 项目概述

This project is an MVP implementation of an **AI-assisted EMR structuring system**.

It focuses on transforming **unstructured clinician–patient conversations** into a **structured, reviewable EMR draft**, with an emphasis on safety, controllability, and traceability.

---

本项目是一个 **AI 辅助病历结构化系统的 MVP 实现**。

核心目标是：  
将 **医患自然语言对话（非结构化）** 转换为 **可审阅、可校验的结构化病历草稿（EMR Draft）**，  
强调 **安全性、可控性与证据可追溯性**。

---

## Core Objectives | 核心目标

- Convert free-text clinical dialogue into structured EMR fields  
- Preserve evidence references for each extracted item  
- Enforce schema-level validation for safety and consistency  
- Keep AI outputs *draft-only* and non-authoritative  

---

- 将自由文本的临床对话转换为结构化病历字段  
- 为每一条抽取内容保留证据来源  
- 通过 Schema 校验保障一致性与安全性  
- 明确 AI 输出仅为「草稿」，不具备医学权威性  

---

## Key Features (MVP Scope) | 主要功能（MVP 范围）

- **LLM-assisted EMR draft generation**  
- **JSON Schema–based validation**  
- **Evidence-linked extraction**  
- **Explicit doctor confirmation requirement**  
- Modular architecture for future expansion  

---

- **基于大模型的病历草稿生成**  
- **基于 JSON Schema 的结构校验**  
- **证据绑定的字段抽取机制**  
- **强制医生确认（Human-in-the-loop）**  
- 为未来扩展预留的模块化架构  


Note: All EMR outputs are drafts and require human review.
注意：所有 EMR 输出均为 草稿，必须经人工审核确认。

Architecture (High-Level) | 系统架构（高层）

Frontend: Lightweight UI for conversation input & draft review

Backend:

LLM API integration

EMR Draft Schema validation (AJV)

No persistent clinical data storage in MVP

前端：用于输入医患对话、审阅病历草稿的轻量界面

后端：

大模型 API 接入

EMR 草稿 Schema 校验（AJV）

MVP 阶段 不做临床数据持久化存储

Design Principles | 设计原则

Draft, not diagnosis

Schema over prose

Traceability over fluency

Human confirmation over automation

草稿，而非诊断

结构优先于文本美观

可追溯性优先于语言流畅度

人工确认优先于自动化决策

Local Development | 本地开发
Prerequisites | 环境要求

Node.js ≥ 18

npm or pnpm

Setup | 启动方式
git clone https://github.com/your-org/emr-structured-assistant-mvp.git
cd emr-structured-assistant-mvp
npm install
npm run dev

Validation | 校验机制

EMR drafts are validated against a predefined JSON Schema.

Validation result is exposed in the UI as:

valid

invalid

Invalid drafts must be corrected before proceeding.

所有病历草稿均需通过预定义的 JSON Schema 校验。

校验结果在界面中显示为：

valid（通过）

invalid（未通过）

未通过校验的草稿不可进入下一流程。

Limitations (Intentional) | 有意限制

Not a medical device

Not a diagnostic system

Not production-hardened

No automated clinical decision making

本系统 不是医疗器械

不提供诊断结论

尚未进行生产级加固

不包含任何自动临床决策能力

该 MVP 旨在验证 结构、流程与可控性，而非规模化部署。

Roadmap (Non-Commitment) | 未来方向（非承诺）

RAG-based medical knowledge grounding

Specialty-specific schemas

Multi-language clinical input

Audit logging

HIS / EMR integration layer

基于 RAG 的医学知识增强

专科化病历 Schema

多语言临床输入

审计日志

HIS / EMR 对接层

Disclaimer | 免责声明

This project is for research and prototyping purposes only.

All outputs are non-clinical drafts and must be reviewed and approved by a licensed medical professional before any real-world use.

本项目仅用于 研究与原型验证。

所有输出均为 非临床草稿，在任何实际使用前，
必须由具备资质的医疗专业人员审核与确认。

License | 许可证

TBD
