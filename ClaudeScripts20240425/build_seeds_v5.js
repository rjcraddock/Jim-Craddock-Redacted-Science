const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
        LevelFormat, BorderStyle } = require('docx');
const fs = require('fs');

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, bold: true, size: 32 })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28 })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24 })]
  });
}
function p(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22 })]
  });
}
function pMixed(runs) {
  return new Paragraph({
    spacing: { after: 120 },
    children: runs.map(r => new TextRun({
      text: r.text, bold: r.bold || false, italics: r.italics || false, size: 22
    }))
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22 })]
  });
}
function bulletMixed(runs) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: runs.map(r => new TextRun({
      text: r.text, bold: r.bold || false, italics: r.italics || false, size: 22
    }))
  });
}
function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22 })]
  });
}
function code(text) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, font: "Courier New" })]
  });
}
function hr() {
  return new Paragraph({
    spacing: { before: 180, after: 180 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 } },
    children: [new TextRun({ text: "" })]
  });
}
function quote(text) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    indent: { left: 720, right: 720 },
    children: [new TextRun({ text, italics: true, size: 22 })]
  });
}

// Seed header helper — primary key on left, series as attribute
function seedHeader(num, title, series) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [
      new TextRun({ text: `Seed ${num}: `, bold: true, size: 32 }),
      new TextRun({ text: title, bold: true, size: 32 }),
      new TextRun({ text: `  [Series: ${series}]`, bold: false, size: 24, italics: true })
    ]
  });
}

const content = [];

// ============================================================================
// TITLE PAGE
// ============================================================================
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 1200, after: 240 },
  children: [new TextRun({ text: "Redacted Science Research Initiative", bold: true, size: 40 })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 480 },
  children: [new TextRun({ text: "Paper Seed Master", size: 32, italics: true })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 240 },
  children: [new TextRun({ text: "Jim Craddock | #TheArchitect", size: 24 })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 240 },
  children: [new TextRun({ text: "redactedscience.org | jimcraddock.com", size: 22 })]
}));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 720 },
  children: [new TextRun({ text: "Version 5 | Last revised: 20260424 (Seed 017 advancement on Sandler 2000 full integration and NCT00936182 three-site structure)", size: 22 })]
}));

// ============================================================================
// PURPOSE
// ============================================================================
content.push(h1("Document Purpose and Usage Instructions"));

content.push(h2("What This Document Is"));
content.push(p("This document contains seed outlines for papers to be generated within the Redacted Science Research Initiative. Each seed is a structured prompt sufficient for an AI instance with access to the project corpus to generate a first-draft paper."));
content.push(p("Version 5 changes the structural organization from series-grouped to flat-table-ordered. Each seed carries a three-digit primary key number assigned at insertion. The series prefix is a mutable attribute, not a numbering scheme. Seeds are ordered in the document by insertion order. The first seed inserted is Seed 001; new seeds append to the end."));

content.push(h2("Data Model"));
content.push(p("The Seed Master functions as a flat table. Each seed is one row. The row's primary key is its three-digit number, permanent from insertion forward. Attributes on the row (series, template, maturity, publication target, last-revised date) are mutable. Seeds may be reclassified (series changed) without affecting the primary key. Seeds that never advance to publication retain their number in the document as intellectual record of what was considered."));
content.push(p("The primary key has three design properties: (1) it identifies the seed unambiguously across time, (2) it survives reclassification, and (3) it does not encode semantic information about the seed. A researcher citing \"Seed 001 of the Paper Seed Master\" retrieves exactly the intellectual object Endometriosis represents, regardless of what series attribute the seed carries at the moment of citation."));

content.push(h2("Numbering Rule"));
content.push(bullet("Numbers are assigned at insertion and never change."));
content.push(bullet("Numbers are three-digit with leading zeros (001, 002, 017). Leading zeros are never truncated."));
content.push(bullet("Numbers reflect insertion order, not series organization."));
content.push(bullet("A new seed receives the next available number and appends to the document."));
content.push(bullet("If a seed is retired or marked stale, the number remains occupied; it is not reassigned."));
content.push(bullet("Not all seeds get written. Unwritten seeds still occupy their number as intellectual record."));

content.push(h2("Architect Report Numbering vs. Seed Numbering"));
content.push(p("Architect Reports track publications; the Seed Master tracks seeds. The two numberings are separate and will diverge permanently. Some seeds generate multiple Architect Reports (V1, V2 revisions). Some generate companion deposits (Clear Evidence argument paper plus protocol). Some generate none. The Architect Report Registry at jimcraddock.com/architect-reports documents every issued report and which seed it derived from."));
content.push(p("Grandfathered note: Architect Report A#002 V1 and V2 (Endometriosis) were issued prior to the v5 numbering convention and retain the A#002 designation. All Architect Reports issued from v5 forward adopt the full series-prefix-plus-version convention (e.g., AS#002 V1, AM#003 V1)."));

content.push(h2("Who This Document Is For"));
content.push(pMixed([{ text: "Primary user: ", bold: true }, { text: "Jim Craddock, Redacted Science, operating with AI assistants (primarily Claude and Grok)." }]));
content.push(pMixed([{ text: "Secondary users: ", bold: true }, { text: "Any AI instance opening this document to work a seed. Any future human collaborator who joins the project." }]));

// Framework Primer
content.push(h2("Framework Primer (canonical short-form summary)"));
content.push(p("The three-paragraph canonical summary below may be adapted (not copied verbatim) by an AI instance generating a paper's introduction. All seed-derived papers should carry a framework summary that matches the voice and substantive content of this primer; variance across outputs should be minimized."));
content.push(pMixed([{ text: "Paragraph 1. ", bold: true }, { text: "The Redacted Science framework proposes that " }, { text: "Candida albicans", italics: true }, { text: " functions as a coevolved biochemical computer in its mammalian hosts, operating a distributed governance system over host physiology through the endocannabinoid interface, the perfusion architecture of the pituitary, and the substrate metabolism of multiple organ systems. The organism is not a pathogen in the conventional sense but a commensal regulator whose activity shapes host biochemistry at every documented timescale from moment-to-moment substrate management to lifelong phenotype expression. Paper A (Craddock, Biochemical Computer) establishes this core model." }]));
content.push(pMixed([{ text: "Paragraph 2. ", bold: true }, { text: "The Saline Oscillation Hypothesis (Craddock, Saline Oscillation) places the framework in evolutionary context: the organism-host partnership coevolved under the Plio-Pleistocene salinity oscillations of the East African Rift System, selecting for symbiont capability to manage host electrolyte balance, perfusion, and stress response during environmental pressure. This produces the " }, { text: "Homo candidus", italics: true }, { text: " phenotype the framework recognizes as ancestral and, in the Pan-Mammalian extension, generalizes to " }, { text: "Mammalia candidus", italics: true }, { text: " across the mammalian clade." }]));
content.push(pMixed([{ text: "Paragraph 3. ", bold: true }, { text: "Under this framework, many chronic conditions of modern medicine map onto stuck program modes of the organism-host governance system. The Umbrella Paper (Craddock, Stuck-State Umbrella) articulates the stuck-state model. The framework predicts that conditions currently treated symptomatically will respond differently when the organism layer is recognized and addressed, and that population-level patterns in chronic disease epidemiology reflect organism-host relationship disruptions rather than purely host-side dysfunctions." }]));

// Required Context
content.push(h2("Required Context Before Working Any Seed"));
content.push(p("An AI instance new to the project must review the following before attempting to draft a seeded paper."));

content.push(h3("The Three Foundational Papers"));
content.push(bulletMixed([{ text: "Paper A — ", bold: true }, { text: "Craddock, Biochemical Computer", italics: true }, { text: " — DOI: 10.5281/zenodo.19337525." }]));
content.push(bulletMixed([{ text: "Paper B — ", bold: true }, { text: "Craddock, Saline Oscillation", italics: true }, { text: " — DOI: 10.5281/zenodo.19369715." }]));
content.push(bulletMixed([{ text: "Paper C — ", bold: true }, { text: "Craddock, Longitudinal Case Study", italics: true }, { text: " — DOI: 10.5281/zenodo.19560800." }]));

content.push(h3("Framework Extensions"));
content.push(bulletMixed([{ text: "Craddock, Pan-Mammalian Hypothesis ", italics: true }, { text: "— DOI: 10.5281/zenodo.19643601." }]));
content.push(bulletMixed([{ text: "Craddock, Implications of Biochemical Computer ", italics: true }, { text: "— DOI: 10.5281/zenodo.19488041." }]));
content.push(bulletMixed([{ text: "Craddock, Focal Infections 2.0 ", italics: true }, { text: "— DOI: 10.5281/zenodo.19423069." }]));
content.push(bulletMixed([{ text: "Craddock, Exposé ", italics: true }, { text: "— DOI: 10.5281/zenodo.19393803." }]));

content.push(h3("Clinical Case Reports"));
content.push(bulletMixed([{ text: "Craddock, Acute Hemodynamic Decompensation ", italics: true }, { text: "— DOI: 10.5281/zenodo.19462705." }]));

content.push(h3("Clear Evidence, No Trial Series"));
content.push(bulletMixed([{ text: "Craddock, Clear Evidence IBS ", italics: true }, { text: "— DOI: 10.5281/zenodo.19645403." }]));
content.push(bulletMixed([{ text: "Craddock, Clear Evidence IBS Protocol ", italics: true }, { text: "— DOI: 10.5281/zenodo.19646550." }]));

content.push(h3("Stuck-State Series"));
content.push(bulletMixed([{ text: "Craddock, Stuck-State Umbrella ", italics: true }, { text: "— DOI: 10.5281/zenodo.19582484." }]));
content.push(bulletMixed([{ text: "Craddock, T2D Stuck State ", italics: true }, { text: "— DOI: 10.5281/zenodo.19582791." }]));
content.push(bulletMixed([{ text: "Craddock, Obesity Stuck State ", italics: true }, { text: "— DOI: 10.5281/zenodo.19600443." }]));
content.push(bulletMixed([{ text: "Craddock, Anorexia Stuck State ", italics: true }, { text: "— DOI: 10.5281/zenodo.19583423." }]));
content.push(bulletMixed([{ text: "Craddock, IBS Stuck State ", italics: true }, { text: "— DOI: 10.5281/zenodo.19598460." }]));
content.push(bulletMixed([{ text: "Craddock, Parkinson's Stuck State ", italics: true }, { text: "— DOI: 10.5281/zenodo.19600888." }]));

content.push(h3("Architect Reports"));
content.push(bulletMixed([{ text: "Architect Report A#002 V2 — Endometriosis as Organism-Directed Tissue Recruitment ", italics: true }, { text: "— (generated from Seed 001). Grandfathered under pre-v5 convention." }]));

content.push(p("Zenodo community: zenodo.org/communities/redactedscience/. Search: metadata.creators.person_or_org.name:\"Craddock\""));

content.push(h3("Core Vocabulary Used Across All Seeds"));
content.push(p("Biochemical computer; version conflict; interface error; stuck program mode; Homo candidus; Mammalia candidus; phase transitions; quorum sensing; saline oscillation; TODIC (Terminal Onset Diabetes Insipidus with Candidosis); feeding mechanism; overflow-retrieval cycle; pituitary override; net-output reframe; organism-managed architecture; governance load."));

// Series attributes reference
content.push(h2("Series Attribute Values"));
content.push(p("The series attribute on each seed takes one of the following values. Series does not determine seed number; it is a classification tag for downstream filtering, registry organization, and Architect Report designation."));
content.push(bulletMixed([{ text: "AM ", bold: true }, { text: "— Mechanism. Specific biochemical, anatomical, or behavioral mechanisms operating under the framework." }]));
content.push(bulletMixed([{ text: "AS ", bold: true }, { text: "— Stuck State. Chronic conditions under the Umbrella paper's stuck-program-mode model." }]));
content.push(bulletMixed([{ text: "AB ", bold: true }, { text: "— Substance (AB for suBstance). Dietary inputs, pharmaceuticals, environmental compounds interacting with organism-host governance." }]));
content.push(bulletMixed([{ text: "AI ", bold: true }, { text: "— Autoimmune Collateral. Conditions conventionally classified as autoimmune, reframed as organism-directed immune activity." }]));
content.push(bulletMixed([{ text: "AH ", bold: true }, { text: "— Historical/Institutional. Suppression, regulatory capture, institutional self-preservation patterns. The Exposé paper anchors this series." }]));
content.push(bulletMixed([{ text: "AO ", bold: true }, { text: "— Observational. Case studies, longitudinal observations, family-relative and cross-host observations." }]));

// Voice and Style
content.push(h2("Voice and Style Requirements"));
content.push(p("All seeded papers follow the three-voice framework:"));
content.push(numbered("Academic voice for cited literature and formal scientific claims."));
content.push(numbered("Storytelling voice for framework narrative and mechanism explanation."));
content.push(numbered("#TheArchitect bracketed asides for lived authority and editorial commentary. Reserved for framework papers. NOT used in Clear Evidence series entries."));
content.push(p("Additional standing requirements: no em dashes (AI writing tell); \"coevolution\" one word lowercase; \"Pan-Mammalian\" hyphenated; C. albicans italicized consistently; Times New Roman 12pt; hanging indent references; date format YYYYMMDD with no separators."));

content.push(h3("Voice Calibration for AH Series"));
content.push(p("For papers in the AH series (Historical/Institutional), the #TheArchitect voice runs at higher density and sharper edge than in clinical framework papers. The author's 23-year Medical Informatics career provides direct institutional authority; the voice reflects that authority unapologetically."));
content.push(p("Bracketed asides occur at approximately every 400-600 words of prose, compared to every 1200-1800 words in clinical papers. Asides in institutional papers may name economic incentives, regulatory capture, and institutional self-preservation patterns directly."));
content.push(pMixed([{ text: "Sardonic wit may be used where the subject matter invites it.", bold: true }, { text: " Sardonic wit lands when earned by the material: a regulator saying one thing while the public record shows another, a funding stream moving opposite to the stated mission, an economic interest hiding in plain sight inside a guideline. Sardonic wit fails when deployed at genuinely earnest actors, at patients, or as default voice rather than selective tool." }]));

// Citation Discipline
content.push(h2("Citation Discipline"));
content.push(p("An AI instance generating a paper from a seed may cite ONLY sources in the following four categories. Citations outside these categories are flagged in a separate \"Suggested additional citations\" block at the end of the draft for author review rather than inserted inline."));
content.push(bulletMixed([{ text: "(a) ", bold: true }, { text: "Papers already in the Redacted Science Research Initiative corpus, cited by author-short-title format (see Citation Convention below)." }]));
content.push(bulletMixed([{ text: "(b) ", bold: true }, { text: "Peer-reviewed citations specified in the seed's Existing Literature Support section." }]));
content.push(bulletMixed([{ text: "(c) ", bold: true }, { text: "Non-peer-reviewed sources that themselves cite one or more Redacted Science Research Initiative papers, with traceable citation trail, clearly identified as non-peer-reviewed." }]));
content.push(bulletMixed([{ text: "(d) ", bold: true }, { text: "Other Architect Reports, identified by their canonical designation (series prefix, number, version suffix), Zenodo DOI, and Registry entry." }]));

content.push(h3("Citation Convention"));
content.push(p("Cite RS foundational papers using author-short-title format inline. Prose references to \"Paper A / Paper B / Paper C\" are acceptable within sentences."));
content.push(p("Inline citation examples:"));
content.push(bullet("(Craddock, Biochemical Computer) — for Paper A"));
content.push(bullet("(Craddock, Saline Oscillation) — for Paper B"));
content.push(bullet("(Craddock, Longitudinal Case Study) — for Paper C"));
content.push(bullet("(Craddock, Stuck-State Umbrella; Craddock, IBS Stuck State) — multiple RS citations"));
content.push(p("Do NOT use year-letter suffix format such as (Craddock, 2026a). This format is deprecated."));

// Output Format
content.push(h2("Output Format Requirements"));
content.push(p("First draft of any seeded paper is delivered as a downloadable Microsoft Word document (.docx file) with the following standard sections in order. Streaming output to a chat window in lieu of producing a file is a failure mode; the file deliverable is required for downstream editorial pass, Zenodo deposit, and Registry authentication."));
content.push(numbered("Abstract (250-400 words)"));
content.push(numbered("Keywords (one term per entry, Zenodo-compatible)"));
content.push(numbered("Introduction (with adapted Framework Primer)"));
content.push(numbered("Framework Basis"));
content.push(numbered("Mechanism"));
content.push(numbered("Predictions (numbered, with evidence class)"));
content.push(numbered("Discussion"));
content.push(numbered("Counter-Arguments Addressed"));
content.push(numbered("Conclusion"));
content.push(numbered("Closing Declaration"));
content.push(numbered("References (hanging-indent, alphabetized)"));
content.push(numbered("Suggested Additional Citations (if any)"));

// What a seed is NOT
content.push(h2("What a Seed Is Not (failure mode prevention)"));
content.push(bullet("Not a literature review (unless Review publication target is specified)"));
content.push(bullet("Not a pre-registered protocol (unless Clear Evidence Protocol companion is specified)"));
content.push(bullet("Not a case report (unless Case Report publication target is specified)"));
content.push(bullet("Not a textbook chapter or general framework introduction"));
content.push(bullet("Not a clinical practice guideline or treatment recommendation"));

// Maturity Checklist
content.push(h2("Maturity Upgrade Checklist"));
content.push(p("A seed advances from developing to ready-to-draft only when all of the following are true:"));
content.push(numbered("The Claim field contains a single-sentence testable claim."));
content.push(numbered("The Framework Basis field points to specific foundational paper content."));
content.push(numbered("The Mechanism field is articulated in 2-4 paragraphs."));
content.push(numbered("At least three Predictions are specified with Evidence Class."));
content.push(numbered("At least three Existing Literature Support entries are identified."));
content.push(numbered("At least three Counter-Arguments are drafted with Responses."));
content.push(numbered("Publication Target is selected."));
content.push(numbered("What This Seed Is NOT boundaries are explicit."));

// Failure Modes
content.push(h2("Failure Modes to Watch For in AI-Generated Output"));
content.push(bulletMixed([{ text: "Loss of framework voice. ", bold: true }, { text: "Reverts to textbook medical writing." }]));
content.push(bulletMixed([{ text: "Invented citations. ", bold: true }, { text: "Any citation not falling in categories (a)-(d)." }]));
content.push(bulletMixed([{ text: "Over-hedging. ", bold: true }, { text: "\"Might be suggested,\" \"some have speculated.\"" }]));
content.push(bulletMixed([{ text: "Missing Architect voice. ", bold: true }, { text: "Framework papers should carry bracketed asides; Clear Evidence should not." }]));
content.push(bulletMixed([{ text: "Cut or underweight counter-arguments. ", bold: true }, { text: "Verify substantive responses present." }]));
content.push(bulletMixed([{ text: "Confabulated specific values. ", bold: true }, { text: "Dates, lab values, DOIs not in seed or corpus." }]));
content.push(bulletMixed([{ text: "Framework primer copied verbatim. ", bold: true }, { text: "Primer is for adaptation, not copy-paste." }]));
content.push(bulletMixed([{ text: "Wrong citation format. ", bold: true }, { text: "Year-letter suffix instead of author-short-title." }]));
content.push(bulletMixed([{ text: "Missing Keywords section. ", bold: true }, { text: "Mandatory under v4 forward." }]));
content.push(bulletMixed([{ text: "No file deliverable. ", bold: true }, { text: "Output streamed to chat window instead of produced as a downloadable .docx file. Chat-streamed output cannot be directly uploaded to Zenodo, authenticated by hash, or stored as the canonical draft. Requires regeneration with explicit file-output instruction." }]));
content.push(bulletMixed([{ text: "Missing footer or closing declaration. ", bold: true }, { text: "Footer format and closing declaration are mandatory; missing either indicates the AI did not read or follow Output Format Requirements." }]));

// Authentication
content.push(h2("Architect Report Authentication Architecture"));
content.push(p("All papers generated through the Redacted Science Seed Analysis Process are issued as Architect Reports under their series prefix. The Architect Report Registry at jimcraddock.com/architect-reports is the authoritative source; each entry lists series prefix, number, version, Zenodo DOI, Nostr event ID, and SHA-256 hash of the canonical PDF."));

content.push(h3("Closing Declaration Template"));
content.push(quote("This Architect Report [PREFIX#NNN V#] was generated through the Redacted Science Seed Analysis Process, from Seed [NNN] of the Paper Seed Master, under the Redacted Science Research Initiative. Issued [date] by Jim Craddock, #TheArchitect. Authenticity verifiable at jimcraddock.com/architect-reports. Papers claiming any A-series designation not listed in the registry are not authentic Architect Reports."));

content.push(h3("Footer Format"));
content.push(pMixed([{ text: "LEFT: ", bold: true }, { text: "Architect Report [PREFIX#NNN V#]  |  " }, { text: "MIDDLE: ", bold: true }, { text: "Redacted Science Research Initiative  |  " }, { text: "RIGHT: ", bold: true }, { text: "Page NNN" }]));

// Seed Test-Run
content.push(h2("Seed Test-Run Procedure"));
content.push(numbered("Verify seed maturity is ready-to-draft."));
content.push(numbered("Load the full project (framework corpus plus this master) into the AI instance."));
content.push(numbered("Paste seed content and the instruction: \"Generate a first draft of this paper per the Redacted Science voice and style requirements in the Paper Seed Master. Use the framework corpus in context. Cite only per Citation Discipline categories (a)-(d) using the author-short-title format. Produce output as a downloadable Microsoft Word document (.docx file) with all required sections including Keywords, footer, closing declaration, and V1 version suffix. Do not stream the output to the chat window in lieu of producing the file.\""));
content.push(numbered("Expected first-draft length: 3000-6000 words standard; 1500-3000 words Clear Evidence; 4000-8000 words substantial mechanism."));
content.push(numbered("Run the Failure Mode checklist against the output."));
content.push(numbered("Zero-one failure: accept for editorial pass. Two-three: request regeneration. Four+: revise seed or master."));
content.push(numbered("Update seed status with draft date, AI instance, failure count."));
content.push(numbered("Editorial pass; Zenodo deposit; Registry update; Nostr issuance."));

content.push(hr());

// ============================================================================
// TEMPLATES
// ============================================================================
content.push(h1("The Three Seed Templates"));
content.push(p("Each paper type asks a different question. Use the template that matches the question the paper answers."));
content.push(bulletMixed([{ text: "Template A — Condition: ", bold: true }, { text: "claims about a named disease, chronic condition, or syndrome mapping onto the framework." }]));
content.push(bulletMixed([{ text: "Template B — Substance: ", bold: true }, { text: "claims about a substance, compound, dietary input, drug, or exposure." }]));
content.push(bulletMixed([{ text: "Template C — Mechanism: ", bold: true }, { text: "claims about a specific biochemical, anatomical, or behavioral mechanism." }]));

content.push(h2("Template A: Condition Seed"));
content.push(code("## Seed NNN: [Condition name]  [Series: AS | AI | AO | etc.]"));
content.push(code("**Template:** A (Condition)"));
content.push(code("**Maturity:** [seed | developing | ready-to-draft]"));
content.push(code("**Last revised:** YYYYMMDD"));
content.push(code("**Publication target:** [specific]"));
content.push(code(""));
content.push(code("### Claim (one sentence)"));
content.push(code("### What this seed is NOT"));
content.push(code("### Framework basis"));
content.push(code("### Conventional understanding and its gaps"));
content.push(code("### Mechanism (framework reading)"));
content.push(code("### Predictions (numbered, with evidence class)"));
content.push(code("### Existing literature support"));
content.push(code("### Counter-arguments to address"));
content.push(code("### Related existing Redacted Science work"));
content.push(code("### Notes and observations"));
content.push(code("### Status"));

content.push(h2("Template B: Substance Seed"));
content.push(code("## Seed NNN: [Substance name]  [Series: AB]"));
content.push(code("**Template:** B (Substance)"));
content.push(code("**Maturity:** [seed | developing | ready-to-draft]"));
content.push(code("**Last revised:** YYYYMMDD"));
content.push(code("**Publication target:** [specific]"));
content.push(code(""));
content.push(code("### Claim (one sentence)"));
content.push(code("### What this seed is NOT"));
content.push(code("### Framework basis"));
content.push(code("### Substance characterization"));
content.push(code("### Organism-direct effects"));
content.push(code("### Host-system effects"));
content.push(code("### Population-level signature"));
content.push(code("### Predictions (numbered, with evidence class)"));
content.push(code("### Existing literature support"));
content.push(code("### Counter-arguments to address"));
content.push(code("### Related existing Redacted Science work"));
content.push(code("### Notes and observations"));
content.push(code("### Status"));

content.push(h2("Template C: Mechanism Seed"));
content.push(code("## Seed NNN: [Mechanism description]  [Series: AM]"));
content.push(code("**Template:** C (Mechanism)"));
content.push(code("**Maturity:** [seed | developing | ready-to-draft]"));
content.push(code("**Last revised:** YYYYMMDD"));
content.push(code("**Publication target:** [specific]"));
content.push(code(""));
content.push(code("### Claim (one sentence)"));
content.push(code("### What this seed is NOT"));
content.push(code("### Framework basis"));
content.push(code("### Mechanism (core description)"));
content.push(code("### Anatomical or physiological sites involved"));
content.push(code("### Evidence already in the corpus"));
content.push(code("### Predictions (numbered, with evidence class)"));
content.push(code("### Existing literature support"));
content.push(code("### Counter-arguments to address"));
content.push(code("### Related existing Redacted Science work"));
content.push(code("### Notes and observations"));
content.push(code("### Status"));

content.push(hr());

// ============================================================================
// SEED TABLE (flat, ordered by insertion)
// ============================================================================
content.push(h1("Seed Table"));
content.push(p("Seeds are listed in insertion order. Each seed carries a permanent three-digit primary key. Series attribute is mutable; primary key is not."));

// ---- SEED 001 ----
content.push(seedHeader("001", "Endometriosis as Organism-Directed Tissue Recruitment", "AS"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "A (Condition)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "PUBLISHED as Architect Report A#002 V2 (grandfathered designation). Seed remains available for future revisions." }]));
content.push(pMixed([{ text: "Publication target: ", bold: true }, { text: "Stuck State series entry; Clear Evidence companion protocol candidate." }]));
content.push(p("Claim: Endometriosis represents a Stuck State in which C. albicans-directed tissue recruitment produces ectopic endometrial establishment and maintenance at sites the organism has colonized, with the menstrual-cycle symptom pattern reflecting organism response to cyclic hormonal substrate availability."));
content.push(p("Full seed content carried in Architect Report A#002 V2 and the Zenodo deposit. Paper available at 10.5281/zenodo.19718491 (verify exact version DOI at Registry)."));

// ---- SEED 002 ----
content.push(seedHeader("002", "ApoB/LDL Net-Output Reframe", "AM"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "C (Mechanism)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "developing (priority for next ready-to-draft advancement)" }]));
content.push(pMixed([{ text: "Publication target: ", bold: true }, { text: "Zenodo AM# framework paper" }]));
content.push(p("Claim: Serum LDL-C is best understood as the net equilibrium between hepatic production, receptor-mediated clearance, and organism-directed consumption, rather than as a direct measure of host-side lipid metabolism alone. This net-output framing parallels the pituitary hormone reframe applied elsewhere in the framework."));
content.push(p("Framework basis: (Craddock, Biochemical Computer) for organism substrate management; (Craddock, Longitudinal Case Study) for the 12-year linear cholesterol trajectory at 4.0 mg/dL per year anchoring the observation; (Craddock, Saline Oscillation) for coevolutionary positioning."));
content.push(p("Mechanism: Conventional LDL measurement treats serum value as output of hepatic production and peripheral uptake. Under the framework, a third variable operates at continuous scale: organism consumption of LDL particles as substrate, and organism signaling that modulates hepatic production of ApoB-containing particles. Wang et al. (2024) documented direct organism-mediated LDL-C elevation via formyl-methionine, HIF-2α activation, and ceramide synthesis. Dell'Olmo et al. (2021) identified antifungal cryptide peptides embedded in ApoB itself."));
content.push(p("Predictions: (1) Framework-positive subjects show less LDL-C variance and more linearity than framework-negative subjects matched for age/diet. (2) Antifungal intervention produces LDL-C decreases within 4-8 weeks correlated with baseline mycobiome markers. (3) ApoB/LDL-C ratio differs between framework-positive and framework-negative subjects."));
content.push(p("Literature support: Wang et al. (2024, Cell Host & Microbe); Dell'Olmo et al. (2021, AMB, 105(5), 1953-1964). Status: developing; highest priority for next advancement."));

// ---- SEED 003 ----
content.push(seedHeader("003", "Quorum Sensing as Stuck-State Clustering Mechanism (with cross-kingdom QS)", "AM"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "C (Mechanism)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "developing" }]));
content.push(pMixed([{ text: "Publication target: ", bold: true }, { text: "Zenodo AM# framework paper" }]));
content.push(p("Claim: Chronic disease clustering (metabolic syndrome, autoimmune clusters, psychiatric-GI comorbidity, reproductive-GI comorbidity) is produced by quorum sensing between C. albicans and the bacterial microbiome it co-governs, not by the fungal organism alone. Cross-kingdom QS (documented between Pseudomonas aeruginosa and C. albicans; Fourie & Pohl 2019 review) extends the framework's governance model to include bacterial partners as coordinated state-change executors."));
content.push(p("Status: developing; needs Hogan 2006 literature and Fourie-Pohl review integration."));

// ---- SEED 004 ----
content.push(seedHeader("004", "Adult-Onset Weight Gain Transition", "AS"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "A (Condition)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "developing (priority advancement candidate)" }]));
content.push(pMixed([{ text: "Publication target: ", bold: true }, { text: "Stuck State series companion to Obesity Stuck State; Substack public-audience essay companion" }]));
content.push(p("Claim: Adult-onset weight gain without clear dietary or activity change represents an organism governance threshold crossing event rather than a metabolic slowdown, with specific predictive markers distinguishing the transition event from sustained obesity."));
content.push(p("Pairs with the existing Obesity Stuck State paper but focuses on the transition event. Strong public-audience potential."));

// ---- SEED 005 ----
content.push(seedHeader("005", "Recurrent Aphthous Stomatitis (Canker Sores)", "AS"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "A (Condition)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "seed" }]));
content.push(p("Claim: Recurrent aphthous stomatitis represents chronic low-level mucosal C. albicans activity producing ulcerative tissue breakdown at local pH-disruption points (acidic foods, mechanical trauma). The conventional literature has no strong etiology; the framework reads it as a mucosal-compartment stuck state."));

// ---- SEED 006 ----
content.push(seedHeader("006", "Chronic Rhinosinusitis with Aspergillus Co-Colonization", "AS"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "A (Condition)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "seed" }]));
content.push(p("Claim: Chronic rhinosinusitis with aspergillus culture positivity represents a primary C. albicans governance failure in the sinus compartment producing chronic inflammation, with Aspergillus arriving as secondary colonizer in the compromised niche. Repeated surgical drainage without antifungal coverage perpetuates the pattern. Distinct from AFRS but mechanistically related."));

// ---- SEED 007 ----
content.push(seedHeader("007", "Dietary Sulfur Withdrawal as Stuck-State Destabilizer", "AB"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "B (Substance)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "developing" }]));
content.push(pMixed([{ text: "Publication target: ", bold: true }, { text: "Clear Evidence, No Trial series entry with companion pre-registered protocol" }]));
content.push(p("Claim: Dietary sulfur-amino-acid withdrawal, specifically through cessation of habitual egg consumption, can destabilize an organism-host governance architecture in individuals whose biochemistry has calibrated to a sustained sulfur input, producing decompensation events whose timing and character the stuck-state framework predicts and that standard nutritional medicine does not recognize as diet-related."));
content.push(p("Framework basis: (Craddock, Biochemical Computer) general framework of organism-managed host biochemistry extended to sulfur amino acid substrate class; (Craddock, Longitudinal Case Study) 2021 decline cluster with two-egg breakfast cessation as contributor; (Craddock, Stuck-State Umbrella)."));
content.push(p("Key literature: Miller et al. (2005, Aging Cell); Wang et al. (2024); Dell'Olmo et al. (2021). Status: developing; needs methionine restriction trial and egg cessation cohort literature search."));

// ---- SEED 008 ----
content.push(seedHeader("008", "HFCS as Population-Scale Substrate Availability Event", "AB"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "B (Substance)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "developing" }]));
content.push(pMixed([{ text: "Publication target: ", bold: true }, { text: "Zenodo framework paper with Substack companion essay; Clear Evidence entry candidate" }]));
content.push(p("Claim: High-fructose corn syrup, introduced at scale into the US food supply beginning in the 1970s, constitutes a population-scale substrate availability event for the resident C. albicans symbiont population, whose shifted metabolic activity and host-governance output produced the epidemiological signatures (T2D, NAFLD, obesity, metabolic syndrome) that mainstream medicine attributes to caloric or macronutrient effects alone."));
content.push(p("Substance characterization: HFCS-42/HFCS-55, corn-derived, introduced 1970, widespread 1978-1984. US per-capita rose from ~0 in 1970 to ~60 lbs/person/year by 2000. Unbound monosaccharides in aqueous solution produce faster fructose uptake and different distal-bowel substrate availability than caloric-equivalent sucrose."));
content.push(p("Key literature: Bray et al. (2004, AJCN); Lustig; Tappy; Wang et al. (2024); Dell'Olmo et al. (2021); Mexico sugar-tax natural experiment (2013 onward)."));

// ---- SEED 009 ----
content.push(seedHeader("009", "Proton Pump Inhibitors in Framework-Positive Patients", "AB"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "B (Substance)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "seed (priority)" }]));
content.push(p("Claim: Long-term PPI use in framework-positive patients accelerates organism expansion by removing the gastric acid ecological constraint, producing higher rates of chronic disease transitions than matched controls. Widespread chronic medication (tens of millions of US patients). Strong Clear Evidence companion candidate."));

// ---- SEED 010 ----
content.push(seedHeader("010", "Doxycycline and Tetracycline-Class Antibiotics", "AB"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "B (Substance)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "seed" }]));
content.push(p("Claim: Doxycycline and tetracycline-class antibiotics accelerate fungal expansion in framework-positive patients by eliminating bacterial competitors, with the drug's anti-inflammatory effect (matrix metalloproteinase inhibition) masking the visible signal while worsening underlying architecture. Particularly relevant in chronic fungal sinusitis, where the drug is frequently prescribed."));

// ---- SEED 011 ----
content.push(seedHeader("011", "Turmeric and Curcumin Formulation Variability", "AB"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "B (Substance)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "seed" }]));
content.push(p("Claim: The observation that identical active compound (curcumin) produces different symptomatic responses across commercial preparations suggests that preparation process, carrier compounds, or contamination interact with organism ecology rather than the compound itself operating in isolation. Testable via multi-brand N-of-1 observational protocol."));

// ---- SEED 012 ----
content.push(seedHeader("012", "Autoimmune Collateral Umbrella Paper", "AI"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "A (Condition, umbrella)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "developing (foundational for series)" }]));
content.push(pMixed([{ text: "Publication target: ", bold: true }, { text: "Zenodo AI series anchor paper" }]));
content.push(p("Claim: Conditions conventionally classified as autoimmune represent collateral effects of organism-directed tissue recruitment, organism-mimetic antigen presentation, and organism-protective immune redirection, rather than spontaneous host-self-attack. The umbrella paper establishes the mechanism class and provides the framework scaffold for individual condition papers under the series."));
content.push(p("Structural parallel to Umbrella Stuck State paper."));

// ---- SEED 013 ----
content.push(seedHeader("013", "Celiac Disease as Framework-Positioned Autoimmunity", "AI"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "A (Condition)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "developing (priority; Dr. Bath audience)" }]));
content.push(p("Claim: Celiac disease represents autoimmune collateral of organism-host mucosal governance failure in the HLA-DQ2/DQ8 genetically predisposed host, with the gluten-tTG-deamidation cascade providing the antigenic hook while the organism layer explains differential penetrance of the same HLA type across populations and individual lifespans."));
content.push(p("Framework basis includes Akbari et al. (likely gluten-Neolithic transition literature, verify citation); Th1/Th2 balance literature; HLA-DQ2/DQ8 penetrance data; celiac-thyroid-endometriosis comorbidity clusters."));

// ---- SEED 014 ----
content.push(seedHeader("014", "Hashimoto's Thyroiditis as Framework-Positioned Autoimmunity", "AI"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "A (Condition)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "developing" }]));
content.push(p("Claim: Hashimoto's thyroiditis represents autoimmune collateral of organism-directed activity at the thyroid compartment, with the iodine-sensitive nature of both thyroid metabolism and C. albicans providing the compartment-specific interface. Strong female skew, pregnancy-onset patterns, and GI-reproductive comorbidity clusters are consistent with organism governance shifts."));

// ---- SEED 015 ----
content.push(seedHeader("015", "CDC/MMWR Suppression Case", "AH"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "C (Mechanism, institutional variant)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "seed" }]));
content.push(p("Claim: A specific documented instance of data suppression in contemporary CDC/MMWR practice demonstrates that the institutional-erasure mechanism documented historically in the Exposé paper operates in modern form. Tracks the specific suppression event (to be specified from author's working notes), the institutional actors involved, the public record inconsistencies, and the downstream consequences for affected researchers and patient populations."));
content.push(p("Voice calibration: AH series — sardonic wit permitted where material invites it. Architect asides at higher density than clinical papers."));

// ---- SEED 016 ----
content.push(seedHeader("016", "DSHEA Regulatory Barrier and the Lemon Balm Example", "AH"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "C (Mechanism, institutional/regulatory/economic variant)" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "seed" }]));
content.push(p("Claim: The 1994 Dietary Supplement Health and Education Act (DSHEA) prevents grocery-available compounds with documented antifungal, anxiolytic, and AChE inhibitor properties from being marketed for therapeutic purposes, creating a structural economic barrier between cheap functional interventions and the pharmaceutical markets they would compete with. Lemon balm serves as the concrete example (antifungal; anxiolytic via GABA receptor activity; AChE inhibitor with documented cognitive effects) covering approximately $22B in combined pharmaceutical market equivalents."));
content.push(p("Strong public-audience potential. Substack companion feasible."));

// ---- SEED 017 ----
content.push(seedHeader("017", "Autism Spectrum Disorder as Developmental Stuck-State", "AS"));
content.push(pMixed([{ text: "Template: ", bold: true }, { text: "A (Condition) — with AI series overlap for Trajectory A immune-activation subgroup" }]));
content.push(pMixed([{ text: "Maturity: ", bold: true }, { text: "ready-to-draft for all three deployment paths (SHANK3-subtyped, Clear Evidence No Trial companion, full-spectrum autism). Remaining literature gaps are now non-blocking and can be addressed within the papers." }]));
content.push(pMixed([{ text: "Publication target: ", bold: true }, { text: "Stuck State series entry as full Architect Report; SHANK3-subtyped first deployment as shortened paper; Clear Evidence No Trial companion (NCT00936182) as independent deployment" }]));

content.push(h3("Claim"));
content.push(p("Autism spectrum disorder represents stuck-state program execution within critical developmental windows, where outcome phenotype is determined not by distinct underlying mechanisms but by the timing of stuck-state onset relative to ongoing neurodevelopment, with two distinguishable trajectories (perturbation-triggered regression from typical development; early-locked development from prenatal or perinatal stuck-state establishment) producing the heterogeneity the autism spectrum displays."));

content.push(h3("What this seed is NOT"));
content.push(p("This seed is not a review of autism spectrum disorder literature. It is not a clinical practice guideline. It is not a treatment protocol. It is not a claim about any single cause of autism. It is not a claim that vaccines cause autism. It is not a claim that antifungal therapy is a universal treatment for autism. It is a framework paper proposing a specific stuck-state mechanism that may operate across a subset of autism presentations, generating testable predictions that would identify which subset and which interventions are framework-responsive."));

content.push(h3("Framework basis"));
content.push(bullet("(Craddock, Biochemical Computer) — organism cross-kingdom signaling access to neurological, immune, GI, autonomic, and endocrine interfaces."));
content.push(bullet("(Craddock, Saline Oscillation) — coevolutionary framework; developmental windows as substrate-surface events."));
content.push(bullet("(Craddock, Stuck-State Umbrella) — stuck program mode model; this seed extends the model into neurodevelopmental disorder."));
content.push(bullet("(Craddock, IBS Stuck State) — structural template for bowel-comorbidity reading."));
content.push(bullet("(Craddock, Pan-Mammalian) — vertical symbiont transmission as contributor to apparent heritability."));

content.push(h3("The Two-Trajectory Model (core seed contribution)"));
content.push(p("Trajectory A — Perturbation-Triggered Regression. Typical development proceeds for months or years. A perturbation event (antibiotic exposure, infection, immune activation, dietary shift, environmental trigger, hormonal transition) pushes the system into a stuck state. Clinical expression more often includes retained cognitive infrastructure (higher representation in high-functioning presentations). Imaging shows visible event signature."));
content.push(p("Trajectory B — Early-Locked Development. Stuck state established prenatally or in the first months of life. Gut-brain axis, immune calibration, sensory integration, myelination develop around the altered signal set. Clinical expression tends toward broader developmental delay. Imaging reads as fewer abnormalities because measurement baseline is atypical-as-default."));
content.push(p("Back-Explanation of the Rochat Paradox: Rochat et al. (2020) found HF > DD imaging abnormalities in ASD under 5, paradoxical under conventional models. Under the two-trajectory model the finding is predicted."));
content.push(h3("Preclinical and Clinical Validation of Trajectory A"));
content.push(p("Trajectory A now has independent clinical and preclinical validation."));
content.push(p("Clinical: Sandler et al. (2000) treated 11 regressive-onset autistic children with oral vancomycin, showing significant improvement in behavior and communication (P=.003 on both), with behavioral deterioration within two weeks of discontinuation and return toward baseline across 2-8 month follow-up. Fecal analysis revealed absent Peptostreptococcus species and anaerobic cocci in all four children sampled, contrasting with 93% presence at approximately 10% of stool microorganisms in 104 adult controls. The authors explicitly proposed a gut-brain connection with neurotoxin-producing opportunistic bacteria as the mechanism, drew parallels to infant botulism and C. difficile colonization, and flagged autoantibody literature as a potential infectious-trigger pathway. The 2000 paper framed the full framework position and documented its central predicted ecological signature. The field did not systematically pursue it."));
content.push(p("Preclinical: Qiao et al. (2026) showed that Shank3 haploinsufficient mice (Sh3+/-) exhibit no baseline autism phenotype. Systemic LPS challenge produces motor impairment, anxiety-like behaviors, and excessive grooming approaching the homozygous phenotype. Anti-inflammatory treatment partially rescues. Transcriptomic analysis shows upregulation of neuroinflammation-related genes and downregulation of synaptic function genes; pro-inflammatory microglial activation via TLR4; synapse engulfment. The authors explicitly frame this as a preclinical model of behavioral regression, citing the ~40% regression rate in SHANK3-associated ASD and their prior finding that immunomodulator treatments helped patients."));
content.push(p("Framework reading: Sandler 2000 and Qiao 2026 together provide clinical and preclinical support for the Trajectory A architecture — host susceptibility plus activation event produces the locked phenotype that did not occur without the event. The activation event in Qiao was LPS (bacterial endotoxin). The activation event in the Sandler cohort was unspecified but preceded the regression. The framework predicts that organism-mediated inflammatory triggering through the same TLR4-microglia-synapse-engulfment pathway produces equivalent results, and that the Sandler finding of absent commensal anaerobic cocci represents exactly the kind of ecological disruption under which C. albicans expansion and TLR4-pathway inflammation become accessible. C. albicans is a competent producer of TLR4 ligands, a documented modulator of microglial activation state, and a direct interface for vagal and systemic inflammatory signaling. The measurement gap between bacterial-LPS trigger (demonstrated) and organism-mediated trigger (predicted) is the framework's central additional claim."));
content.push(p("Paper 2 (Wu S. et al. 2024, Molecular Autism) independently localizes the Shank3-autism phenotype to AgRP neurons in the hypothalamic arcuate nucleus, with p38α acting as the inflammatory mediator — an anatomical site at the pituitary-hypothalamus interface directly relevant to the organism's documented governance architecture. Paper 1 (Gao et al. 2025, Translational Psychiatry) documents hippocampal NMDA receptor subtype downregulation in the R1117X homozygous model. Paper 3 (Wang et al. 2017, JCI) localizes repetitive behavior to striatopallidal indirect-pathway MSNs with DREADD-based rescue. Taken together, the four papers reconstruct a distributed-circuit model of SHANK3-ASD in which different behavioral components express from different vulnerable circuits, each of which has framework-documented organism access."));

content.push(h3("Predictions"));
content.push(numbered("Differential Candida mycobiome burden between ASD subjects and controls, with bimodal distribution within ASD. Partial retrospective validation: Adams et al. (2024); Kantarcioglu et al. (2016); Strati et al. (2017)."));
content.push(numbered("Regression history distinguishes an antifungal-responsive subgroup from non-regressive cases."));
content.push(numbered("GI comorbidity severity correlates with antifungal response magnitude. Partial support: Adams et al. (2011) correlation at r=0.59, p<0.001."));
content.push(numbered("Antifungal response is bimodal rather than normally distributed."));
content.push(numbered("Maternal antibiotic exposure correlates with Trajectory B presentations in the child."));
content.push(numbered("NCT00936182 results, if recoverable, show bimodal response in pyrosequencing-positive-yeast subset."));
content.push(numbered("Wu MSR et al. (2024) SHANK3 mouse rescue, if baseline mycobiome measured, correlates with gut Candida burden rather than operating purely via host-directed IGF1R/lipid raft mechanism."));
content.push(numbered("In Shank3 haploinsufficient mice, gut mycobiome burden at time of inflammatory challenge correlates with severity of regression phenotype; antifungal pretreatment attenuates the Qiao et al. (2026) LPS-triggered behavioral regression; organism bloom or dysbiosis produces the regression phenotype in the absence of LPS in the susceptible genotype. [Evidence class: preclinical replication with mycobiome covariates.]"));
content.push(numbered("The ecological disruption signature identified by Sandler et al. (2000) — specifically the absence of Peptostreptococcus species and other anaerobic cocci documented in all four tested regressive-autism fecal samples against 93% presence in 104 adult controls — should be replicable in modern regressive-ASD cohorts with current 16S and ITS sequencing methods, and absent-commensal status should correlate with C. albicans burden and antifungal-intervention response. [Evidence class: replication study with paired bacterial and fungal sequencing in regressive-ASD cohorts.]"));

content.push(h3("Existing literature support"));
content.push(bullet("Shaw, Kassen & Chaves (2000) — nystatin open-label in 23 children, CARS improvement p=0.037. Clinical Practice of Alternative Medicine 1(1):15-26."));
content.push(bullet("Adams JB, Krajmalnik-Brown R, et al. (2024) — bimodal Candida distribution in ASD. Gut Microbes."));
content.push(bullet("Adams JB, Johansen LJ, Powell LD, Quig D, Rubin RA (2011) — GI-autism severity correlation at r=0.59, p<0.001. BMC Gastroenterology 11:22."));
content.push(bullet("Baker SM, Shaw W (2020) — single-case complete recovery with itraconazole. Integrative Medicine 19(4):20-27, PMC7572136."));
content.push(bullet("Ramirez PL et al. (2013) — antibiotic+antifungal combination. Case Reports in Psychiatry 2013:239034."));
content.push(bullet("Finegold SM, Dowd SE, Gontcharova V, et al. (2010) — pyrosequencing of fecal microflora in regressive autism. Anaerobe 16(4):444-453."));
content.push(bullet("Sandler RH, Finegold SM, Bolte ER, et al. (2000) — short-term benefit of oral vancomycin in regressive-onset autism. J Child Neurol 15(7):429-435. [11 children, all regressive-onset, mean age at onset 17.7 months (±3.4), mean age at treatment 59.9 months (±13.3). Behavior analog scale improved from baseline median 2.2 to post-treatment 5.0 (P=.003); Communication from 1.7 to 4.6 (P=.003). Blinded videotape review: 8 of 10 improved, 1 no change, 1 possibly worse. Six of 11 showed brief (1-4 days) hyperactivity within 3 days of vancomycin initiation (Herxheimer-like reaction). Substantial behavioral deterioration within 2 weeks of vancomycin discontinuation in most children; all but one returned toward baseline at 2-8 month follow-up. Quantitative fecal flora in 4 children revealed ABSENT Peptostreptococcus species and anaerobic cocci vs. 93% presence at ~10% of stool microorganisms in 104 adult controls — the single most framework-relevant ecological finding in the ASD-microbiome literature. Authors explicitly proposed gut-brain connection and neurotoxin-producing bacteria hypothesis, drew parallels to infant botulism, C. difficile, and D-lactic acidosis. Authors speculated spore-forming organisms as relapse mechanism; framework adds that C. albicans persistence through antibacterial therapy extends the same logic to fungal population release from bacterial co-governance. Authors also flagged autoantibodies to neural proteins (NAFP, GFAP, MBP) in autism literature with infectious-trigger hypothesis. The field had the full framework available in 2000 and did not systematically pursue it.]"));
content.push(bullet("Kantarcioglu AS, Kiraz N, Aydin A (2016) — Microbiota-Gut-Brain Axis: Yeast Species Isolated from Stool Samples of Children with Suspected or Diagnosed ASD and In Vitro Susceptibility Against Nystatin and Fluconazole. Mycopathologia 181(1-2):1-7. DOI: 10.1007/s11046-015-9949-3. PMID: 26442855. [Confirms Candida presence across pediatric ASD cohort with drug-susceptibility data for both nystatin (Shaw 2000 drug) and fluconazole (NCT00936182 drug).]"));
content.push(bullet("Strati F et al. (2017) — altered gut mycobiome in ASD children, Candida enrichment documented."));
content.push(bullet("Rochat MJ, Distefano G, Maffei M, et al. (2020) — 117 ASD children under 5 MRI cohort; HF > DD imaging abnormalities. Brain Sciences 10(10):741."));
content.push(bullet("Hsiao EY et al. (2013) — maternal immune activation + microbiota + autism-like behavior in mouse model. Cell."));
content.push(bullet("Wang et al. (2024) — microbiome-vagus-behavior. Cell Host & Microbe, PMID 38754418."));
content.push(bullet("Wu MSR et al. (2024, preprint) — fluconazole reverses SHANK3-related autism-like deficits via lipid raft-driven IGF1R activation and prefrontal circuit remodeling. GSE313444. [Authors did not measure mycobiome.]"));
content.push(bullet("Gao J, Wu S, Yang J, et al. (2025) — Comprehensive behavioral characterization and impaired hippocampal synaptic transmission in R1117X Shank3 mutant mice. Translational Psychiatry 15:274. DOI: 10.1038/s41398-025-03505-1. [Hippocampal NMDA receptor subtype downregulation; learning and memory deficits; distributed-circuit architecture.]"));
content.push(bullet("Wu S, Wang J, Zhang Z, et al. (2024) — Shank3 deficiency elicits autistic-like behaviors by activating p38α in hypothalamic AgRP neurons. Molecular Autism 15:14. DOI: 10.1186/s13229-024-00595-4. [Localizes Shank3 autism phenotype to hypothalamic ARC at the pituitary-hypothalamus interface; p38α inflammatory mediator in AgRP neurons; rescue via p38α inactivation.]"));
content.push(bullet("Wang W, Li C, Chen Q, et al. (2017) — Striatopallidal dysfunction underlies repetitive behavior in Shank3-deficient model of autism. J Clin Invest 127(5):1978-1990. DOI: 10.1172/JCI87997. [Repetitive grooming localized to striatopallidal indirect-pathway MSNs; DREADD-based rescue.]"));
content.push(bullet("Qiao SN, Wang SE, Kim KY, et al. (2026) — Inflammation increases the penetrance of behavioral impairment in Shank3 haploinsufficiency mice — can it explain the behavioral regression in Autism? Molecular Psychiatry. DOI: 10.1038/s41380-026-03534-2. [Direct Trajectory A validation: Shank3+/- mice show no baseline phenotype; LPS challenge produces motor impairment, anxiety, excessive grooming; anti-inflammatory treatment partially rescues; microglia activation via TLR4; synapse engulfment; authors explicitly frame this as a preclinical model of behavioral regression citing ~40% regression rate in SHANK3-ASD.]"));
content.push(bullet("NCT00936182 — Fluconazole in Children with ASD. Three-site double-blind, randomized, placebo-controlled RCT registered 2009. Principal investigators: Doreen Granpeesheh PhD (Tarzana, CA — Center for Autism and Related Disorders); Daniel Rossignol MD (Melbourne, FL — International Child Development Resource Center); Brian Jepson MD (Austin, TX — Thoughtful House). Enrollment contingent on pyrosequencing-positive yeast; 30-day treatment; pre-specified behavioral outcome hypothesis. Results never published. Seventeen years of silence. Contact chain obsolete (CARD contact phone now routes to Medicare sales as of 20260424). Registered nine years after Sandler et al. (2000) had already demonstrated vancomycin-responsive regressive autism with explicit microbiome hypothesis and absent Peptostreptococcus finding; the trial was the proper rigorous test of the fungal-extension question that Sandler had framed. That the field waited nine years to design the test, then produced no results across seventeen subsequent years, is the artifact. The silence is the finding."));

content.push(h3("Counter-arguments to address"));
content.push(numbered("Vaccines cause autism. [Response: framework does not make this claim. Immune activation events broadly can trigger stuck-state transitions in susceptible hosts. Distinct from proximate-cause claim.]"));
content.push(numbered("~90% heritability — autism is genetic. [Response: vertical symbiont transmission plus genetic susceptibility to stuck-state locking produces heritable phenotype without single-locus causation.]"));
content.push(numbered("Regression reports unreliable. [Response: regression is Trajectory A's primary observable; Finegold (2010) already demonstrated regression-specific microbiome signatures.]"));
content.push(numbered("Spectrum heterogeneity defeats unitary-mechanism models. [Response: heterogeneity is predicted consequence of stuck-state onset timing interacting with developmental stage.]"));
content.push(numbered("Shaw 2000 never replicated. [Response: measurement-avoidance pattern is itself framework-relevant; NCT00936182 registered, apparently run, results never published.]"));

content.push(h3("Notes and observations"));
content.push(bullet("Two-trajectory model may eventually deserve its own standalone AM# framework paper."));
content.push(bullet("Clear Evidence No Trial companion on NCT00936182 may advance independently as framework-neutral first deployment."));
content.push(bullet("Vaccine-question handling requires explicit editorial decision in eventual Architect Report."));
content.push(bullet("Adaptive-enrichment trial design optimal for Predictions 1-4."));
content.push(bullet("Sensitivity: voice and framing require care. Recommend heavy editorial pass on any first-draft."));

content.push(h3("Gaps to close before advancing to ready-to-draft (full-spectrum version)"));
content.push(bullet("Systematic MRI-in-ASD review stratified by regression history."));
content.push(bullet("Maternal antibiotic exposure to ASD risk with timing detail."));
content.push(bullet("Pediatric mycobiome normative data by age."));
content.push(bullet("Sandler vancomycin trial regression-subset re-read."));
content.push(bullet("Wu MSR (2024) SHANK3 mouse data availability — whether GSE313444 deposit includes banked mycobiome samples or whether authors deliberately did not collect."));
content.push(bullet("Operational Trajectory A vs. B definition for retrospective cohort application."));

content.push(h3("Gaps closed (20260424)"));
content.push(bullet("Kantarcioglu full bibliographic confirmation — Mycopathologia 2016, 181(1-2):1-7, PMID 26442855, DOI 10.1007/s11046-015-9949-3."));
content.push(bullet("Sandler vancomycin trial full integration — all regressive-onset; significant improvement (P=.003); 2-week post-discontinuation deterioration; absent Peptostreptococcus species in all tested fecal samples vs. 93% in adult controls; explicit microbiome-mechanism framing by authors in 2000."));
content.push(bullet("NCT00936182 structure — three sites (Tarzana/Melbourne/Austin), three PIs (Granpeesheh/Rossignol/Jepson), 2009 registration, seventeen-year silence. Trial design was rigorous: double-blind, randomized, placebo-controlled, pyrosequencing-positive-yeast enrollment, pre-specified behavioral outcome hypothesis. Registered nine years after Sandler framed the hypothesis."));
content.push(bullet("NCT00936182 results recovery — acknowledged as unrecoverable; the silence is the finding for Clear Evidence companion paper."));
content.push(bullet("Trajectory A clinical validation — Sandler et al. (2000) documented regressive-onset autism responsive to vancomycin with ecological signature (absent Peptostreptococcus) and post-discontinuation relapse."));
content.push(bullet("Trajectory A preclinical validation — Qiao et al. (2026) directly demonstrates host-susceptibility-plus-activation-event architecture in Shank3+/- mice with LPS challenge; anti-inflammatory rescue; microglia-TLR4-synapse-engulfment pathway. Authors explicitly frame as preclinical regression model."));
content.push(bullet("Shank3 distributed-circuit architecture — three papers (Gao 2025 hippocampus; Wu S. 2024 hypothalamic AgRP; Wang 2017 striatopallidal) together document that different Shank3-ASD symptoms localize to different vulnerable circuits, each framework-accessible."));

content.push(h3("Status"));
content.push(p("Maturity upgraded 20260424 on strength of Sandler 2000 full integration, Qiao 2026 Trajectory A preclinical validation, and full SHANK3-circuit literature integration (Gao 2025; Wu S. 2024; Wang 2017; Kantarcioglu 2016). Three deployment paths now available:"));
content.push(bullet("SHANK3-subtyped Architect Report — ready-to-draft. Narrower scope centered on SHANK3-associated ASD with direct preclinical validation; addresses the ~40% regression rate with specific mechanism claims."));
content.push(bullet("Clear Evidence No Trial #2 companion (NCT00936182) — ready-to-draft. Stands independent of framework commitment. Three-site rigorous RCT registered 2009, seventeen years silent. Registered nine years after Sandler framed the hypothesis. The artifact is the silence."));
content.push(bullet("Full-spectrum Autism Architect Report — ready-to-draft. Sandler 2000 clinical validation plus Qiao 2026 preclinical validation now supply the Trajectory A backbone; the remaining gaps (MRI stratification, maternal antibiotic timing, pediatric mycobiome normative data, operational Trajectory A/B definition) can be addressed in the paper itself or flagged as future work rather than gating publication."));

content.push(hr());

content.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 360 },
  children: [new TextRun({ text: "End of Seed Table. New seeds append here with the next available three-digit number (018, 019, etc.). Series attribute is mutable; primary key is not.", italics: true, size: 22 })]
}));

// Build
const doc = new Document({
  creator: "Jim Craddock",
  title: "Redacted Science Paper Seed Master v5",
  styles: { default: { document: { run: { font: "Times New Roman", size: 22 } } } },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    children: content
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/claude/RedactedScience_PaperSeedMaster_v5.docx", buffer);
  console.log("Written. Size:", buffer.length, "bytes");
});
