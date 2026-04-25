const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
        PageOrientation, ExternalHyperlink, BorderStyle, PageBreak } = require('docx');
const fs = require('fs');

// ============================================================================
// Helper builders
// ============================================================================

// Parse a bracket-aware paragraph string into a Paragraph with italic brackets
// Brackets in the text marked with [*...*] become italic runs.
function parseRichPara(text, opts = {}) {
  const runs = [];
  let remaining = text;
  // Use a regex that captures either [*italic*] or *italic-only* segments or plain text
  // For simplicity split on [*...*]
  const re = /\[\*([\s\S]+?)\*\]/g;
  let lastIndex = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      // plain text before the bracket
      runs.push(...parseInlineItalics(text.slice(lastIndex, m.index), false));
    }
    // italic bracket content - prepend [ and append ] and render italic
    runs.push(new TextRun({ text: '[', italics: true }));
    runs.push(...parseInlineItalics(m[1], true));
    runs.push(new TextRun({ text: ']', italics: true }));
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    runs.push(...parseInlineItalics(text.slice(lastIndex), false));
  }
  return new Paragraph({
    children: runs,
    spacing: { after: 180, line: 300 },
    ...opts
  });
}

// Handle *italic* within a segment. If baseItalic is true, flip: *...* becomes non-italic.
function parseInlineItalics(segment, baseItalic) {
  const out = [];
  const re = /\*([^*]+)\*/g;
  let lastIndex = 0;
  let m;
  while ((m = re.exec(segment)) !== null) {
    if (m.index > lastIndex) {
      out.push(new TextRun({ text: segment.slice(lastIndex, m.index), italics: baseItalic }));
    }
    out.push(new TextRun({ text: m[1], italics: !baseItalic }));
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < segment.length) {
    out.push(new TextRun({ text: segment.slice(lastIndex), italics: baseItalic }));
  }
  return out;
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true })],
    spacing: { before: 360, after: 180 }
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true })],
    spacing: { before: 240, after: 120 }
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, italics: true })],
    spacing: { before: 180, after: 100 }
  });
}

function doiLine(doi, refs) {
  const children = [new TextRun({ text: 'DOI: ', bold: true })];
  if (doi) {
    const url = `https://doi.org/${doi}`;
    children.push(new ExternalHyperlink({
      link: url,
      children: [new TextRun({ text: doi, style: 'Hyperlink', color: '0563C1', underline: {} })]
    }));
  } else {
    children.push(new TextRun({ text: '[to be assigned when deposited]', italics: true, color: '666666' }));
  }
  if (refs) {
    children.push(new TextRun({ text: `  —  ${refs} references`, color: '666666' }));
  }
  return new Paragraph({
    spacing: { after: 240 },
    children
  });
}

function plainPara(text) {
  return parseRichPara(text);
}

// Divider line
function divider() {
  return new Paragraph({
    spacing: { before: 240, after: 240 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999', space: 1 }
    },
    children: [new TextRun({ text: '' })]
  });
}

// ============================================================================
// Paper entry builder
// ============================================================================

function paperEntry({ number, prefix, title, doi, refs, protocolDoi, summary, abstract, seedFooter }) {
  const children = [];

  // Section heading — use prefix (e.g. "AS#001") if provided, else numeric
  const heading = prefix ? `${prefix}. ${title}` : `${number}. ${title}`;
  children.push(h1(heading));

  // DOI line (with reference count appended as plain text if provided)
  children.push(doiLine(doi, refs));

  // Protocol DOI sub-line (for Clear Evidence paper)
  if (protocolDoi) {
    children.push(new Paragraph({
      spacing: { before: 0, after: 120 },
      indent: { left: 360 },
      children: [
        new TextRun({ text: '↳ Pre-Registered Trial Protocol: ', italics: true, size: 22, color: '666666' }),
        new TextRun({ text: `https://doi.org/${protocolDoi}`, size: 22, color: '1155CC', underline: {} })
      ]
    }));
  }

  // Summary subsection
  children.push(h2('Summary for the Reader from the Architect'));
  for (const para of summary) {
    children.push(plainPara(para));
  }

  // Abstract subsection — skipped for seed master (abstract is optional)
  if (abstract && abstract.length > 0) {
    children.push(h2('Abstract'));
    for (const para of abstract) {
      children.push(plainPara(para));
    }
  }

  // Seed-draft footer for Architect Reports
  if (seedFooter) {
    children.push(new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({ text: seedFooter, italics: true, size: 18, color: '7a9a6a' })
      ]
    }));
  }

  // Divider between papers
  children.push(divider());

  return children;
}

// ============================================================================
// Content
// ============================================================================

const papers = [
  // ------------------------------------------------------------- 1. Paper A
  {
    number: 1,
    title: 'Candida albicans as a Biochemical Computer',
    doi: '10.5281/zenodo.19337525',
    refs: 52,
    summary: [
      'This is the foundation. Every other paper in this series rests on one claim: Candida albicans [*the yeast your doctor dismisses as "a normal part of your gut flora"*] is not a pathogen sitting around waiting to cause a problem — it is a biochemical computer, and it has been running inside you your whole life.',
      'It senses. It decides. It acts. It remembers. [*Yes, I said "remembers." Stay with me.*]',
      'The paper pulls together decades of peer-reviewed fungal biology — phenotypic switching [*shape-shifting between yeast and hyphae, which is closer to "changes body plan on command" than anything you\'ve ever seen a microbe do*], parasexual reproduction [*a third kind of reproduction that isn\'t sexual, isn\'t asexual, and wasn\'t supposed to exist*], quorum sensing [*chemical voting — cells counting each other in real time and changing behavior based on the result*], cross-kingdom signaling [*speaking chemical languages to bacteria AND to your cells, fluently, in both directions*], lipid-mediated communication, and — new in this version — a hybrid-origin genome architecture that reads as purpose-built for host-facing computation, a body-wide non-blood distribution network (the interstitium) that the organism uses to move between niches, and a reinterpretation of pituitary microadenomas as governance-load signatures rather than random growths — and reorganizes all of it into a single model.',
      'Individually, these findings are scattered across fungal journals nobody in mainstream medicine reads. [*Seriously. Go look. Mycology is the unloved stepchild of microbiology.*] Assembled, they describe an organism with sensing, processing, output, and memory — the four components of a computer. Pure biochemical and biological programming, no sentience. [*None. It\'s just reactive code in living form.*]',
      'The argument is not that any single piece is new. The argument is that nobody has put the pieces together before, and when you do, the picture that emerges reframes the organism entirely.',
      'The reader does not need to accept the full co-evolutionary story in Paper B to accept Paper A. Paper A stands on published findings alone. [*Go check the citations. I\'ll wait.*]'
    ],
    abstract: [
      'Candida albicans functions as a distributed biochemical computer, processing host and environmental signals through multiple parallel channels to modulate immunity, metabolism, tissue remodeling, and endocannabinoid tone. This paper details its distinctive genetic hardware (~1,300 orphan genes with no orthologs in other yeasts), ancient CUG codon reassignment (~171 ± 27 Ma), divergence from C. dubliniensis with asymmetric gene-family expansion (~20 Ma), parasexual cycle for rapid diversity generation, and layered signaling architecture (extracellular vesicles with morphology-dependent cargo, candidalysin and Ece1 peptide panel, secreted aspartyl proteases, cholinergic receptor interface, authentic prostaglandin E2 production from host arachidonic acid, cross-kingdom RNA potential, tryptophan-kynurenine pathway modulation, mast cell activation via cell wall pattern recognition, direct modulation of host metabolic state through suppression of plasma leptin (Peroumal et al., 2022) and elevation of apolipoprotein-B-containing lipoproteins via formyl-methionine–HIF-2α–ceramide signaling (Wang et al., 2024), and a dopaminergic signaling intersection through the Gpr1 receptor).',
      'The hybrid origin of C. albicans from a Miocene fusion of two parental lineages at approximately 2.8% sequence divergence (Mixão and Gabaldón, 2020) is integrated here as the source of the chimeric genome architecture: loss of heterozygosity fixes host-calibrated input sensors to a single optimized version while retained ancestral heterozygosity at effector, adhesion, efflux, and phenotypic-switch loci supports combinatorial output — a committed-input, parallel-output design consistent with distributed biochemical computation. The organism\'s extracellular vesicle output channel, now documented to reach the central nervous system via the nasal-mucosal route in mammalian therapeutic contexts (Madhu et al., 2026), is proposed as a chronic endogenous delivery vector of the colonized state, with inverse valence relative to the therapeutic reference.',
      'The interstitium, a body-wide network of fluid-filled collagen-lined compartments (Benias et al., 2018), is identified as the physical distribution layer connecting peripheral colonies to host nutrient interfaces and enabling inter-niche signal propagation without bloodstream exposure. Multi-timescale epigenetic memory, from white-opaque phenotypic locking to chromatin-level bet-hedging and mitochondrial genome methylation, enables state maintenance without genomic change.',
      'The pituitary microadenoma, conventionally classified as a benign incidental neoplasm with a prevalence of 14-22% in autopsy and radiological studies, is reinterpreted here as a tissue stress response to sustained organism-driven governance load on the anterior pituitary, supported by documented hyphal access to the gland, confirmed molecular machinery for local hormone transport, sequestration, and enzymatic modification, an epidemiological profile consistent with variable organism demand rather than spontaneous neoplasia, and a longitudinal case study documenting microgranuloma formation, hyphal migration to the pituitary region, and subsequent structural failure under escalating load across four transition phases (Craddock, 2026c). Pharmacovigilance data further confirm the governance architecture: azole antifungals produce endocrine cascades whose breadth and specificity track the drug\'s inhibitory profile against organism-host enzymatic nodes (11β-HSD2, 11β-hydroxylase, CYP17A1), with reporting odds ratios exceeding 800 for posaconazole-associated apparent mineralocorticoid excess and a clean mechanistic split between azoles that hit these nodes and those that do not. Standard diagnostic panels compound this invisibility: urine bicarbonate, the most informative marker for the renal tubular acidosis this governance predicts, was removed from routine urinalysis, and creatinine-based renal filtration estimates systematically overestimate function in any subject whose muscle mass is declining under organism-driven substrate progression.',
      'No other organism is known to combine this full toolkit. Fifteen testable predictions, grouped by architectural layer, are offered to evaluate the model, including hybrid-origin bimodal orphan ancestry test and host-mediated subroutine termination via glucose override. The conventional "opportunistic pathogen" classification is re-examined; the organism appears tuned for regulated, long-term persistence rather than unchecked exploitation. This technical grounding is straightforward and stands on its own.'
    ]
  },
  // ------------------------------------------------------------- 2. Pan-Mammalian Coevolution
  {
    number: 2,
    title: 'Redacted Science: The Pan-Mammalian Coevolution Hypothesis',
    doi: '10.5281/zenodo.19643601',
    refs: 8,
    summary: [
      'If Paper A describes the machine and Paper B tells the East African Rift origin story, this paper is the bridge between them — the one that says: *hold on, this isn\'t just about humans.*',
      'The original Redacted Science framing proposed that modern humans coevolved with Candida to produce a physiologically distinct phenotype called *Homo candidus*. [*That framing was necessary. It also happened to be too narrow.*] The interfaces the symbiont uses to run its program — the hypothalamic-pituitary axis [*the brain\'s master endocrine control center*], the endocannabinoid system, sodium-potassium pump dynamics [*the basic electrical machinery every one of your cells runs on*], renal concentrating mechanisms [*how your kidneys decide how much water to keep*], phagocytic immune pathways [*the white blood cells that eat invaders*] — none of these are uniquely human.',
      'All of them are shared across every land mammal. All of them have been preserved across roughly 200 million years of mammalian evolution. [*Which means: whatever agreement your body has with this organism, the deer in your backyard has it too. So does the cow. So does the cat. So does the bat.*]',
      'So this paper says the quiet part out loud: the coevolution didn\'t start with humans. It started with the mammalian body plan itself. The full clade gets a name — ***Mammalia candidus*** — and *Homo candidus* is reframed as a subset of that larger category. [*We aren\'t a special case. We are a special instance of a general case. Every mammal is running some version of the same program.*]',
      'What distinguishes humans, then, isn\'t the presence of the symbiosis. It\'s the capacity for **conscious, volitional participation** in its physiological program. [*A cow can\'t choose to fast through a phase transition. A cow can\'t recognize its own symptoms and modify its diet. A cow doesn\'t write papers about what\'s happening inside it. We can do all three. That\'s the difference that matters.*]',
      'This reframing has consequences the paper walks through. Veterinary medicine becomes a parallel evidence base — every "idiopathic" condition in dogs, cats, horses, and livestock is now a candidate for the same stuck-program analysis. [*If the mechanism is pan-mammalian, so is the disease catalog.*] Mycobiome research gets a clade-wide framing instead of a species-bounded one — comparative Candida ecology across mammals should reveal the program\'s variations. Idiopathic disease — in any mammal, not just humans — gets a unified candidate mechanism.',
      'The paper also positions this hypothesis alongside the companion **Methylation/Neural Selection** framework: Pan-Mammalian Coevolution describes the **structural** layer (what\'s conserved across 200 million years), and Methylation/Neural Selection describes the **runtime** layer (how the program gets configured and transmitted generationally). [*Structure and runtime. The DNA and the software running on it. Both layers are needed to understand the whole architecture.*]',
      'The Saline Oscillation Hypothesis (next in this compilation) then provides the specific environmental mechanism that activated and deepened this pan-mammalian relationship in our ancestors during the East African Rift Plio-Pleistocene.'
    ],
    abstract: [
      'The Redacted Science framework (Craddock, 2025) originally proposed that modern humans coevolved with a fungal symbiont, specifically Candida, producing a physiologically distinct phenotype designated Homo candidus. This paper extends that framing. The conserved mammalian interface systems through which the symbiont operates, including the hypothalamic-pituitary axis, the endocannabinoid system, sodium-potassium pump dynamics, renal concentrating mechanisms, and phagocytic immune pathways, are not uniquely human. They are shared across all land mammals and have been preserved across approximately 200 million years of mammalian evolution.',
      'This paper therefore proposes that the coevolution did not originate with humans but with the mammalian body plan itself, and designates the full clade *Mammalia candidus*. *Homo candidus* is a subset of that broader category, distinguished not by the presence of the symbiosis but by the capacity for conscious, volitional participation in its physiological program.',
      'The Pan-Mammalian Coevolution hypothesis is argued to be complementary to the Methylation/Neural Selection hypothesis, describing respectively the structural and runtime layers of the same symbiotic architecture. Implications for medicine, mycobiome research, and the framing of idiopathic disease are discussed. A specific environmental mechanism for this coevolution is developed in the companion paper on the Saline Oscillation Hypothesis (Craddock, 2026c).'
    ]
  },
  // ------------------------------------------------------------- 3. Paper B (was 2)
  {
    number: 3,
    title: 'The Saline Oscillation Hypothesis',
    doi: '10.5281/zenodo.19369715',
    refs: 229,
    summary: [
      'If Paper A is the machine, Paper B is the origin story — and, more importantly, it is the *mechanism* story. How did a fungus end up this deeply wired into human physiology?',
      'The answer points to the East African Rift Valley, starting around 2.7 million years ago when the climate got weird and stayed weird [*three concentrated windows of extreme oscillation, at 2.7–2.5 Ma, 1.9–1.7 Ma, and 1.1–0.9 Ma — roughly 129 precession cycles total*]. During these windows, cyclical lake salinity swings subjected early hominids to alternating electrolyte overload and depletion across thousands of generations. [*Think: your only water source for thousands of generations, slowly turning saltier over thousands of years, then suddenly becoming fresh due to a shorter-term cycle of the earth and the sun — many, many times.*]',
      '[*For scale: it\'s been about 40 generations since Christianity was founded. Homo candidus evolved over ~90,000 generations. Or more. Let that sit.*]',
      'A fungal symbiont capable of managing host perfusion, electrolytes, and the endocannabinoid system [*your body\'s master regulatory network — the one cannabis works on, yes, but also controls mood, appetite, inflammation, pain, memory, and about forty other things*] gained decisive selective advantage. [*Why? Because having one sure might be handy in that situation, right? That\'s the definition of selective advantage.*] The same volume dysregulation I live with today is what drove the deal our ancestors cut with this organism. [*That\'s not a coincidence. That\'s my body running the ancestral program in a world that no longer supports it.*]',
      'The paper ties this to a specific, recently-identified population. Rogers et al. (2026) published genetic evidence for a previously uncharacterized African population — designated "Z" — that diverged from the main human lineage at ~1.3 Ma and later contributed 19.6% of early modern human ancestry. They could not explain what isolated Z from the rest of humanity for roughly a million years without any mountain range or ocean in the way. [*Paper B proposes culture as the barrier. One population had social structure and elder-taught discipline — prescribed behaviors, dietary rules, ritual — because the program required it to survive the oscillations. The other didn\'t have it and didn\'t need it. That cultural wall held for about a million years. When interbreeding eventually began, the offspring were smarter than the original outer group — but they didn\'t need the elders to survive, so they didn\'t follow them. Homo candidus could not exist without its elders and its teaching. That\'s how the line ended. Not by geography. By dilution.*] Z is the oscillation-exposed lineage. Z is *Homo candidus*.',
      'The flywheel also resolves a puzzle standard African population genetics has never cleanly explained: the pigmentation gradient *within* Africa. The textbook model says dark skin evolved for UV protection. [*Fine — melanin shields folate from UV-induced degradation, and folate matters for neural tube development. The model works for broad latitudinal clines. It doesn\'t work for the details.*] It fails to account for why the Nilotic populations of the Upper Nile Valley [*Dinka, Nuer, Mursi — consistently the most deeply pigmented populations ever measured by reflectance spectrometry*] are so much darker than the San of southern Africa, despite similar UV exposure at similar latitudes. Standard theory has to invoke migration timing or dietary folate compensation or some other ad-hoc add-on to close the gap.',
      'The Saline Oscillation framework closes it cleanly. Darker pigmentation emerges, in part, as a byproduct of running the program — via two independent channels. **Systemically**, the symbiont\'s sustained management of pituitary output drives elevated POMC cleavage, which means elevated α-MSH [*alpha-melanocyte-stimulating hormone — the primary hormonal trigger for melanin production, on the same polypeptide precursor as ACTH and β-endorphin*], which means sustained melanogenic pressure across millions of years of oscillation cycles. **Locally**, basal epidermal Candida colonization triggers melanocytes directly — TLR4 recognition of the organism plus PGE2 produced by Candida from host arachidonic acid both stimulate melanin synthesis from inside the skin tissue itself. [*Melanin does end up protecting the host from UV damage — the organism is invested in the host\'s long-term viability — but the mechanism isn\'t "designed protection." It\'s a statistical bias that emerges when you run the existing subroutines, in these conditions, for millions of years. The protection is real. The protection is incidental.*]',
      'The geographic distribution maps onto this directly. The Upper Nile Valley lies downstream of the East African Rift lake systems where the oscillation operated. Coastal West Africa is the hotspot of inherited Homo candidus admixture from Population Z. Those are the two darkest regions on the continent. The San, geographically and genetically distant from both, are notably lighter at the same latitude — not because they needed less UV protection, but because they were running less of the program.',
      'A testable prediction falls out of this: skin-site mycobiome profiling combined with reflectance spectrometry should find a residual positive correlation between local Candida density and melanin index, even after controlling for UV exposure history, latitude, and the known pigmentation variants like SLC24A5 and MFSD12. [*Translation: hold everything the standard model accounts for constant, and there should still be a Candida signal. If the correlation is there, the standard model is incomplete. If it isn\'t, the framework has a problem.*]',
      'The paper inventories the signaling channels through which the organism governs the host: the endocannabinoid system as the trunk, and a canopy extending across the GPCR superfamily [*the largest family of cellular receptors in the human body — about 800 of them, and drugs targeting them account for a third of all pharmaceuticals*], the incretin system [*the gut hormones that control insulin and appetite — the GLP-1 target, which the news claimed 1 in 8 US adults were "on" (they lied; the 1-in-8 number was people who had ever tried one)*], voltage-gated calcium channels, GABA-A receptors [*the anxiety and sleep receptor — benzodiazepines work here*], cholinergic receptors, and both arms of immunity.',
      'It reinterprets farnesol — the first quorum-sensing molecule ever identified in a eukaryote [*big deal, evolutionary milestone*] — not as self-signaling but as an effector molecule aimed at the host. [*Twenty-five years of looking and nobody has ever found a farnesol receptor in Candida itself. That is a clue the size of a billboard, not a footnote.*]',
      'The paper then applies the whole framework to cannabinoid hyperemesis syndrome [*CHS — the mysterious condition where heavy cannabis users start cycling through violent vomiting fits that only stop in a hot shower, and modern medicine has no idea why*], a condition with no consensus mechanism, and resolves the three gaps the pharmacological model cannot — including a zero-cost intervention anyone can try tonight. [*Eat something before the episode starts. That\'s it. Details in the paper.*]',
      'It designates the symbiont-active hominid phenotype *Homo candidus* and proposes that a later genetic shift in cardiac architecture from suction-dominant to pump-dominant circulation [*your heart used to pull blood through the chest cavity, now it pushes blood outward against gravity — the comparative anatomy literature documents the shift; the Saline Oscillation framework is the first to tie it to the loss of the symbiont program*] is what broke the co-evolutionary trinity and produced modern chronic disease.',
      'Eighteen falsifiable predictions are presented. [*If even one holds up under experimental test, the textbooks have to be rewritten. If all eighteen hold, it is a different civilization.*]'
    ],
    abstract: [
      'This paper extends the Mammalia candidus pan-mammalian co-evolution hypothesis (Craddock, 2026b) by proposing a specific environmental mechanism: cyclical lake salinity variation in the East African Rift Valley during the Plio-Pleistocene as the driver that activated and deepened the symbiosis between Candida species and hominid hosts. Drawing on paleoclimatological evidence of alternating humid and arid periods producing dramatic lake-level and salinity oscillations (Maslin et al., 2014; Trauth et al., 2005), paleoanthropological evidence of concurrent hominid speciation and encephalization events (Shultz and Maslin, 2013), and established literature on the endocannabinoid system (ECS) as a conserved master regulatory system across mammals (Elphick, 2012), we propose that periodic exposure to increased electrolyte concentrations in drinking water followed by freshwater periods producing electrolyte disruption analogous to the syndrome of inappropriate antidiuretic hormone secretion (SIADH) provided the environmental conditions under which a fungal symbiont capable of managing host perfusion and electrolyte balance gained decisive selective advantage.',
      'The symbiont\'s capacity to fill this role is not limited to the ECS. We present a synthesis of peer-reviewed evidence demonstrating that Candida albicans occupies a unique position in the mammalian internal ecology: it is the only organism in the host microbiome that simultaneously signals across kingdoms (to bacteria, competing fungi, and the mammalian host), possesses physical tissue mobility through hyphal morphological transition, and accesses the host\'s endogenous receptor infrastructure. Confirmed molecular targets of C. albicans metabolites include nuclear transcription factors (FXR, PPARs), voltage-gated calcium channels, GABA-A neurotransmitter receptors, the GLP-1 incretin system, cholinergic receptors, and multiple arms of both innate and adaptive immunity. The endocannabinoid system, while the primary and most ancient interface, represents the trunk of a signaling architecture whose canopy extends across the broader GPCR superfamily and beyond. We reinterpret farnesol, the first quorum-sensing molecule identified in a eukaryote (Hornby et al., 2001), not as a self-regulatory signal but as a multi-target effector molecule deployed to manage the host environment, consistent with the twenty-five-year absence of any identified farnesol receptor in C. albicans itself. The organism possesses confirmed receptors or binding proteins for at least six classes of host hormone, including estrogen, luteinizing hormone, corticosteroids, and androgens, while governing additional endocrine axes through upstream management of pituitary perfusion and ECS-mediated signaling — a two-tier architecture in which the organism senses hormones that provide inbound information and modulates hormones it controls through the producing gland. This same architecture drives increased melanin production as an emergent byproduct, both systemically via elevated pituitary α-MSH output and locally via TLR4 recognition and PGE2 stimulation of epidermal melanocytes, providing an additive driver to conventional UV-folate selection and helping explain the geographic distribution of extreme pigmentation in modern African populations (Jablonski & Chaplin, 2000; Tapia et al., 2014).',
      'The framework further demonstrates that the same biochemical computer architecture, when disrupted by high-potency exogenous THC, produces cannabinoid hyperemesis syndrome (CHS) as an interface-overload state, resolving the paradoxical tissue-specific CB1 downregulation, TRPV1 dysregulation, and compulsive hot-shower relief through Hgt4 glucose sensing and arachidonic-acid competition while unifying immune activation patterns absent ECS transcript changes (Meltzer et al., 2025; GSE303922).',
      'The framework is applied to cannabinoid hyperemesis syndrome (CHS), a condition of rising prevalence that lacks a consensus mechanism in the standard pharmacological model. The organism-mediated model resolves three longstanding gaps — tissue-specific differential downregulation of CB1 receptors (brain vs. gut), TRPV1 dysregulation, and the compulsive hot-shower phenomenon — while unifying the immune activation profile and absence of ECS transcript changes reported in a 2025 whole-blood RNA-seq study (Meltzer et al., 2025; GSE303922). It positions CHS as an interface-disruption state in which high-potency THC overloads the symbiont\'s primary signaling channels, triggering a positive-feedback loop driven by Hgt4 glucose sensing and arachidonic-acid competition.',
      'The model generates eight falsifiable CHS predictions, including an immediate zero-cost intervention: prodromal caloric loading to maintain blood glucose above the organism\'s calibrated ~5 mM threshold. A practical dietary test is also proposed — gradual incorporation of documented anti-Candida foods (virgin coconut oil, Ceylon cinnamon, crushed garlic, oregano oil, and iodized salt) — with explicit guidance on step-wise introduction, potential die-off responses, and the need to differentiate effects in patients with simple THC-triggered disruption versus those with deeper underlying colonization states. No prior published work has proposed C. albicans as a mechanistic contributor to CHS.',
      'We further propose that the social component of the co-evolutionary architecture was initiated before the salinity oscillations through the discovery and communal use of exogenous phytocannabinoids, which promoted peaceful social bonding, group cohesion, and cooperative behavior. This pre-linguistic social flywheel, reinforced epigenetically through transgenerational cannabinoid-induced methylation changes and evolution of cannabis variants through cultivation, established cooperative social structure before the emergence of language. Language did not create the co-evolutionary trinity of symbiont, host physiology, and social structure. It fulfilled the requirements of a civilization based around the passage of knowledge, allowing it to accelerate. Additionally, we note discipline on the order of a religion was necessary to complete the final arcs of coevolution.',
      'The framework predicts that host physiology has co-evolved adaptations to accommodate the symbiont\'s chronic operational demands. Three independent examples are documented: prolactin discharge mechanisms with species-specific timing architecture (anticipation-triggered in stallions, sustained in rodents, climax-locked in humans); host-side nitric oxide pathway tuning enabling erectile function under the low-volume circulatory state of the *Homo candidus* phenotype; and absence of endogenous fungal circadian machinery consistent with outsourcing of rhythm function to the host. Together these examples establish bidirectional adaptation as a structural feature of the *Mammalia candidus* relationship rather than an incidental consequence, with implications for the reinterpretation of multiple physiological phenomena currently lacking unifying mechanistic explanation.',
      'Single-cell transcriptomic evidence (Dumeaux et al., 2023) demonstrating pre-positioned bet hedging, distributed survival strategies, and controlled genome destabilization in C. albicans populations is reinterpreted within this co-evolutionary framework as architectural rather than merely pathogen-adaptive, consistent with an organism refined across approximately 200 million years of mammalian co-evolution. It is the ultimate survivor: a biochemical computer continuously recalculating what moves might be required next. The C. albicans genome (14.3 Mb, approximately 6,400 genes) encodes over 1,300 genes with no orthologs in other yeast species, the majority of which remain functionally uncharacterized.',
      'We designate the symbiont-active hominid phenotype *Homo candidus* and argue that a subsequent genetic shift in cardiac architecture from suction-dominant to pump-dominant circulation disrupted the co-evolutionary trinity, producing the modern human condition in which the symbiont persists commensally but can no longer execute its full physiological program. Eighteen testable predictions are presented, including proposed experiments in simulated gastric environments, comparative mycobiome analysis of Rift Valley populations, computational genomic analysis of uncharacterized C. albicans genes using biological foundation models, and molecular dating of the C. albicans / C. dubliniensis divergence.'
    ]
  },
  // ------------------------------------------------------------- 3. Umbrella
  {
    number: 4,
    title: 'Chronic Disease as Stuck Program Modes of the Candida albicans Biochemical Computer',
    doi: '10.5281/zenodo.19582484',
    refs: 12,
    summary: [
      'This is the umbrella paper — the one that introduces a new category of disease: the *stuck program mode*.',
      'Here\'s the idea. The biochemical computer framework in Paper A says C. albicans runs phased programs — it does one thing, then transitions to doing another, then another, responding to signals from the host and the environment. [*Like the seasons of a farm operation: planting phase, growing phase, harvest phase, fallow phase. Each phase uses a different set of tools.*] Each phase uses specific organism capabilities to manage host physiology. When the signal to move to the next phase fails to arrive, the capability runs indefinitely. The phase gets stuck on. And the host phenotype that results is what conventional medicine classifies as a chronic disease.',
      'The paper lays out a three-gate selection rule for identifying candidates: (1) the organism has a documented mechanism that maps directly onto the disease\'s central pathology, (2) the disease persists in ways conventional medicine can\'t explain [*"unknown etiology," "idiopathic," "multifactorial"*], and (3) the disease shows demographic or geographic clustering consistent with quorum sensing or colonization density dynamics. [*If it clusters by group, by region, or by life stage, that\'s a signal.*]',
      'Five conditions are analyzed in companion papers: **type 2 diabetes** (glucose harvesting without phase transition), **anorexia nervosa** (substrate restriction without phase transition), **irritable bowel syndrome** (gut management frozen in a single operating state), **obesity** (growth/storage without phase transition), and **Parkinson\'s disease** (dopaminergic interface burnout — explicitly flagged as the speculative one of the five).',
      'A unified therapeutic framework is proposed: substrate change, antifungal pressure, and sustained duration. [*Change what you feed it. Put pressure on it. Don\'t stop when you start feeling better — that\'s when people always stop.*] The single measurable variable that should predict disease severity, intervention response, and relapse risk across all five is quorum sensing density. [*Find the density threshold and you find the off-switch.*]'
    ],
    abstract: [
      'This paper introduces the stuck-program model, a framework for understanding chronic diseases as phased biological programs that failed to transition. The model derives from the biochemical computer framework (Craddock, 2026a; 2026b), which describes Candida albicans as a coevolved fungal symbiont operating phased programs within the mammalian host using documented cross-kingdom signaling capabilities. Each program phase employs specific organism capabilities to manage host physiology. When a phase transition signal fails, the capability runs indefinitely, producing a host phenotype that conventional medicine classifies as chronic disease.',
      'A three-gate selection methodology is presented for identifying candidate conditions: (1) documented organism mechanism mapping directly to the disease\'s central pathology, (2) unexplained persistence in conventional medicine, and (3) demographic or geographic clustering patterns consistent with quorum sensing or colonization density dynamics. Five conditions are analyzed in companion papers: type 2 diabetes (glucose harvesting without phase transition), anorexia nervosa (substrate restriction without phase transition), irritable bowel syndrome (gut management frozen in a single operating state), obesity (growth/storage without phase transition), and Parkinson\'s disease (dopaminergic interface burnout; speculative).',
      'A unified therapeutic framework combining substrate change, antifungal pressure, and sustained duration is proposed, along with the identification of quorum sensing density as the single measurable variable that should predict disease severity, intervention response, and relapse risk across all five conditions.'
    ]
  },
  // ------------------------------------------------------------- 4. T2D
  {
    number: 5,
    title: 'Type 2 Diabetes as a Stuck Program Mode',
    doi: '10.5281/zenodo.19582791',
    refs: 14,
    summary: [
      'Of the five stuck modes, this is the cleanest mechanistic case.',
      'The standard story for type 2 diabetes is: too much weight, not enough exercise, bad genes — and then progressive insulin resistance, eventually beta cell failure. [*Beta cells: the pancreatic cells that make insulin. When they fail, you\'re insulin-dependent for life.*] That story does not explain why the deterioration keeps going in patients whose insulin production is still adequate. And it really does not explain why bariatric surgery and extreme caloric restriction produce remission in timeframes too short for the structural changes the model invokes. [*The math doesn\'t work. People improve faster than weight loss alone can account for.*]',
      'Here\'s the alternative. C. albicans has a membrane glucose sensor called Hgt4, calibrated to roughly 5 mM — which happens to be the approximately normal human blood glucose concentration. [*Approximately 90 mg/dL in US units. The setpoint your pancreas is trying to hold.*] That\'s not a coincidence; that\'s a receptor tuned to the host\'s operating range. Peroumal et al. (2022) demonstrated that C. albicans colonization measurably alters GLP-1, GIP, and insulin levels. [*Those are your incretin hormones — the signals that tell your pancreas when and how much insulin to release. The organism can move them.*]',
      'The framework proposes that type 2 diabetes is the organism\'s glucose-harvesting phase running without a phase transition. The modern dietary environment — effectively unlimited glucose — never delivers the substrate shift that would signal "we\'re done here, move to the next phase." [*In the ancestral environment, food availability changed. Seasons, scarcity, feasts, fasts. The signal was built into the environment. Modern food supply removed the signal.*] So the organism keeps running the harvest. Continuous glucose draw. Progressive insulin resistance. Eventually the pancreas can\'t keep up.',
      'The model explains bariatric surgery [*it rearranges the habitat the organism lives in*] and GLP-1 agonists like semaglutide [*Ozempic, Wegovy — they override the sensing channel the organism uses*] as two different ways of breaking the stuck state. Five testable predictions are presented, including studies correlating organism density with insulin resistance severity and with differential treatment response.'
    ],
    abstract: [
      'Type 2 diabetes mellitus (T2D) is characterized by progressive insulin resistance and beta cell failure, resulting in chronic hyperglycemia. The standard model attributes this deterioration to adiposity, sedentary behavior, and genetic predisposition, but does not fully explain why the deterioration is progressive and self-sustaining in patients who maintain adequate insulin production, or why certain interventions (bariatric surgery, extreme caloric restriction) produce remission in timeframes too short to reflect the structural changes the model invokes.',
      'This paper applies the biochemical computer framework (Craddock, 2026a; 2026b) to propose that T2D represents a stuck program mode in which the glucose harvesting capability of the commensal fungal symbiont Candida albicans runs continuously without phase transition. The organism possesses Hgt4, a membrane glucose sensor calibrated to approximately 5 mM human blood glucose. Its colonization measurably alters GLP-1, GIP, and insulin levels (Peroumal et al., 2022). The framework proposes that the modern dietary environment, providing effectively unlimited glucose, prevents the substrate shift signal that would normally advance the organism\'s program to the next phase.',
      'The resulting continuous glucose draw produces the progressive insulin resistance and eventual beta cell failure observed clinically. Five testable predictions are presented, including proposed studies correlating organism density with insulin resistance severity and differential therapeutic response.'
    ]
  },
  // ------------------------------------------------------------- 5. Obesity
  {
    number: 6,
    title: 'Obesity as a Stuck Program Mode of the Candida albicans Biochemical Computer',
    doi: '10.5281/zenodo.19600443',
    refs: 9,
    summary: [
      'If type 2 diabetes is the cleanest stuck mode, obesity is the most diffuse — and the most important. [*Over 1 billion people worldwide. 95% weight regain within five years. That isn\'t insufficient willpower; that is a defended equilibrium.*]',
      'The standard model says you ate too much, moved too little, and now your body is storing the excess. The stuck-program model says the body is doing exactly what it was told to do — and it was told to do it by the organism. [*Growth and storage phase. One of the normal operating modes in the ancestral program. It was supposed to end.*]',
      'The mechanism runs through three channels: the incretin system [*the gut hormones GLP-1 and GIP that tell the pancreas when to release insulin and tell the brain when to feel full — the Ozempic target*], the endocannabinoid system [*CB1 receptors specifically — the same receptors cannabis activates, which is why stoners get the munchies; the organism can drive similar appetite signals without cannabis*], and metabolic state assessment through GLP-1 itself. The modern environment never delivers the substrate shift that ends the storage phase, so the phase keeps running. [*Forever. Until you die of it, or until something breaks the cycle.*]',
      'This is a **version conflict**: an ancestral program refined for Homo candidus running inside a modern host whose environment no longer supplies the signals the program expects. The framework resolves the set-point problem [*why your body fights weight loss like you\'re starving, even when you aren\'t*], explains why bariatric surgery works so dramatically [*habitat disruption — rearrange the real estate the organism lives in*] and why GLP-1 drugs work [*sensing-channel override — you\'re hijacking the signal the organism uses*], and explains the post-1970s epidemic onset through antibiotic-era mycobiome disruption. [*Kill off the bacteria that compete with Candida and guess who has more room to run.*]',
      'Five testable predictions are presented.'
    ],
    abstract: [
      'Obesity affects over 1 billion people globally, with treatment limited by the near-universal failure of sustained weight loss. Approximately 95% of individuals who lose weight through dietary intervention regain it within five years, a recidivism rate that suggests a defended equilibrium rather than insufficient willpower.',
      'This paper applies the biochemical computer framework (Craddock, 2026a; 2026b) to propose that obesity represents a stuck program mode in which the commensal fungal symbiont Candida albicans maintains the host in a growth and storage phase through sustained modulation of the incretin system, endocannabinoid-mediated appetite regulation, and metabolic state assessment via the GLP-1 receptor. This is a systems-level version conflict between a program refined for the Homo candidus phenotype and the modern host environment that no longer supports it.',
      'The framework resolves the set-point problem, explains the dramatic efficacy of bariatric surgery and GLP-1 receptor agonists as habitat disruption and sensing-channel override respectively, and accounts for the post-1970s epidemic onset through antibiotic-era mycobiome disruption. This is the most mechanistically diffuse candidate in the series, operating through multiple simultaneous signaling channels rather than a single-mechanism anchor. Five testable predictions are presented.'
    ]
  },
  // ------------------------------------------------------------- 6. Anorexia
  {
    number: 7,
    title: 'Anorexia Nervosa as a Stuck Program Mode',
    doi: '10.5281/zenodo.19583423',
    refs: 11,
    summary: [
      'Anorexia nervosa has the highest mortality rate of any psychiatric disorder. [*That\'s not a figure of speech. Higher than major depression, higher than schizophrenia, higher than bipolar. The condition kills more of its patients than any other mental illness on the list.*] Relapse rates after weight restoration run 30–50%. Current theory cannot explain why.',
      'Here is the critical clue, from Monteleone et al. (2015): endocannabinoid responses to hedonic eating [*eating for pleasure, not just for survival — the "I want dessert" signal*] remain abnormal in AN patients even after they\'ve been weight-restored. [*The weight comes back. The dysregulation doesn\'t go away. Whatever was broken is still broken.*] Something outlasts the caloric deficit. The physiological disruption is not downstream of starvation — starvation is downstream of the disruption.',
      'The stuck-program model: C. albicans has locked the host into a substrate restriction phase. [*A normal phase in the ancestral program — probably the one that ran during scarcity, when the organism needed to preserve itself and downshift host metabolism. It was supposed to end when conditions changed.*] The organism is modulating endocannabinoid tone [*appetite, reward, satiety signals*], serotonin precursor availability [*by diverting tryptophan into its own kynurenine pathway instead of letting it become serotonin*], and satiety signaling. The restriction phase serves the organism\'s needs in a particular metabolic configuration. The transition signal to resume normal feeding never arrives. [*Interface error. The program is running, the feedback loop is broken, the host starves.*]',
      'The framework explains the pubertal-onset female predominance — the organism has documented sensitivity to estrogen and luteinizing hormone, and the hormonal turbulence of puberty provides both a trigger and an amplifier. [*Why does anorexia hit teenage girls harder than any other demographic? Because the organism responds to estrogen surges. That is not a metaphor.*] The net effect is directly dependent on colonization density — the more organism, the deeper the lock.',
      'Testable predictions link colonization density to endocannabinoid disruption severity and treatment response.'
    ],
    abstract: [
      'Anorexia nervosa (AN) carries the highest mortality rate of any psychiatric disorder, with relapse rates of 30–50% following weight restoration. The persistence of the condition despite aggressive refeeding remains unexplained. Monteleone et al. (2015) demonstrated that endocannabinoid responses to hedonic eating remain abnormal in weight-restored AN patients, indicating that the physiological disruption outlasts the caloric deficit.',
      'This paper applies the biochemical computer framework (Craddock, 2026a; 2026b) to propose that AN represents a stuck program mode in which the organism Candida albicans has locked host feeding behavior into a substrate restriction phase through sustained modulation of endocannabinoid tone, serotonin precursor availability, and satiety signaling. The restriction phase serves the organism\'s program requirements for specific metabolic conditions, but the transition signal to resume normal feeding fails to arrive.',
      'The framework resolves the persistence problem, explains the pubertal-onset female predominance through documented organism sensitivity to estrogen and luteinizing hormone, and generates testable predictions linking organism colonization density to endocannabinoid disruption severity and treatment response. The net effect is directly dependent on colonization density.'
    ]
  },
  // ------------------------------------------------------------- 7. IBS
  {
    number: 8,
    title: 'Irritable Bowel Syndrome as a Stuck Program Mode',
    doi: '10.5281/zenodo.19598460',
    refs: 12,
    summary: [
      'IBS affects 10–15% of the global population. The Rome criteria [*the official diagnostic rules*] define it by what it *isn\'t*: there\'s no structural damage, no infection, no tumor, no ulcer. Just a gut that doesn\'t work right. This paper proposes what it *is*.',
      'IBS is the gut-management phase of the ancestral program, locked in a single operating state. [*Imagine a thermostat stuck on one setting. That\'s the gut.*] The organism normally handles a whole suite of gut functions — motility [*how fast things move through*] via CB1 receptors, barrier integrity [*keeping gut contents from leaking into the bloodstream*] via prostaglandin E2 and immune modulation, visceral pain via TRPV1 [*the same capsaicin/hot-chili receptor, which is why spicy food lights up an IBS gut*], microbiome composition [*which bacteria live there and which don\'t*] via antifungal and antibacterial secretions, and intestinal serotonin [*most of your body\'s serotonin is made in the gut, not the brain*] via tryptophan diversion.',
      'The three IBS subtypes map onto three different frozen modes of the same system. **IBS-D** [*diarrhea-predominant*] = motility phase stuck on. **IBS-C** [*constipation-predominant*] = motility phase stuck off. **IBS-M** [*mixed*] = oscillating between the two without resolving. Same organism. Same toolkit. Different stuck settings.',
      'The framework explains the 2:1 female predominance through the organism\'s documented sensitivity to estrogen and luteinizing hormone [*same mechanism as anorexia — the hormones modulate the colony*], and explains post-infectious IBS [*the version that shows up after a bout of food poisoning or GI infection*] as organism reorganization following the disruption of the bacterial community it was managing. [*Antibiotics for the original infection wiped out the bacterial landscape. The organism had to rebuild. It rebuilt wrong.*]',
      'Testable predictions link IBS subtype to organism morphological state and colonization density distribution.'
    ],
    abstract: [
      'Irritable bowel syndrome (IBS) affects 10–15% of the global population and remains a functional diagnosis defined by symptom criteria in the absence of identifiable structural pathology. The Rome criteria classify IBS by what it is not. This paper proposes what it is: a stuck program mode in which the commensal fungal symbiont Candida albicans has locked host gut management into a single operating state.',
      'The organism manages gut motility through CB1 receptors, barrier integrity through prostaglandin E2 and immune modulation, visceral pain through TRPV1, microbiome composition through antifungal and antibacterial secretions, and intestinal serotonin through tryptophan diversion. IBS subtypes (IBS-D, IBS-C, IBS-M) represent different frozen modes of this same management system.',
      'The framework resolves the persistence of a condition with no structural cause, explains the 2:1 female predominance through documented organism sensitivity to estrogen and luteinizing hormone, accounts for post-infectious IBS as organism reorganization following bacterial disruption, and generates testable predictions linking IBS subtype to organism morphological state and colonization density distribution.'
    ]
  },
  // ------------------------------------------------------------- 8. Parkinson's
  {
    number: 9,
    title: 'Parkinson\'s Disease as a Potential Stuck Program Mode (Speculative)',
    doi: '10.5281/zenodo.19600888',
    refs: 14,
    summary: [
      'This is the speculative one. I\'m flagging it up front.',
      'Parkinson\'s disease is the progressive loss of dopaminergic neurons in the substantia nigra [*a specific region of the midbrain that makes dopamine and controls movement*], producing the textbook motor symptoms — tremor, rigidity, slowness. What most people don\'t know is that the motor symptoms often show up *decades* after the non-motor ones: constipation, depression, cognitive decline, loss of smell. The gut and the brain are connected, and in Parkinson\'s, the gut breaks first. [*By years. Sometimes by decades.*]',
      'That gut-first pattern is why Parkinson\'s has landed on the biochemical computer radar. The stuck-program candidate: the organism runs a dopaminergic interface phase [*a phase where it taps into the host\'s dopamine signaling, probably for a limited duration in the ancestral program — maybe the phase tied to social bonding, maybe the reward-system calibration phase, the paper proposes candidates*]. In the stuck mode, that interface never shuts down. Continuous engagement. Neurotoxic kynurenine pathway metabolites accumulate [*the same tryptophan-diversion pathway the organism uses in IBS and anorexia, but here the downstream products include quinolinic acid, which is directly toxic to neurons*]. The substantia nigra burns out.',
      '**This candidate has the weakest clustering evidence of the five stuck modes, and the mechanistic chain requires more intermediary steps than the others.** [*I\'m saying this out loud because I\'d rather be honest about the soft spots than get caught on them later.*] The paper is included to demonstrate the framework\'s range, to generate testable hypotheses, and to identify the specific evidentiary gaps that would need to be filled. Version conflict is probably at work — a program refined for Homo candidus with a naturally limited duration, stuck without an exit in the modern host. Interface error is probably at work. The specific identity of the intermediate steps is the open question.'
    ],
    abstract: [
      'Parkinson\'s disease (PD) is a progressive neurodegenerative disorder characterized by loss of dopaminergic neurons in the substantia nigra, producing motor symptoms (tremor, rigidity, bradykinesia) and non-motor symptoms (constipation, depression, cognitive decline, anosmia) that often precede motor onset by decades. The non-motor prodrome, particularly the gastrointestinal symptoms, has led to increasing interest in the gut-brain axis as a contributor to PD pathogenesis.',
      'This paper applies the biochemical computer framework (Craddock, 2026a; 2026b) to propose, speculatively, that PD may represent a stuck program mode in which the commensal fungal symbiont Candida albicans drives sustained dopaminergic interface engagement and neurotoxic kynurenine pathway metabolite production, resulting in progressive burnout of substantia nigra neurons. A program refined for Homo candidus with a likely limited duration, but in this case stuck without an exit due to version conflict.',
      'This candidate is explicitly presented as a speculative extension of the framework. The mechanistic chain requires more intermediary steps than the other conditions in this series, and the clustering evidence is the weakest of any candidate. The paper is included to demonstrate the framework\'s range, to generate testable hypotheses, and to identify the specific evidentiary gaps that would need to be filled to strengthen or reject the proposal.'
    ]
  },
  // ------------------------------------------------------------- 9. Implications
  {
    number: 10,
    title: 'Implications of Recognizing Candida albicans as a Biochemical Computer',
    doi: '10.5281/zenodo.19488040',
    refs: 26,
    summary: [
      'If Paper A is the machine and Paper B is the origin story, this paper is the "so what." And the "so what" is the size of the U.S. healthcare system.',
      'Here is the mechanical consequence of the receptor inventory in Paper A: Candida albicans has documented access to at least thirteen host signaling systems [*estrogen, luteinizing hormone, corticosteroids, androgens, acetylcholine, glucose, lactate, tryptophan, arachidonic acid, mast cells, endocannabinoid tone, pituitary perfusion, and the entire cascade of hormones that the pituitary controls*]. Every one of those interfaces maps onto a cluster of conditions that your doctor\'s textbook describes with the phrase "unknown etiology" or "multifactorial." [*Medical Latin for "we have no idea."*]',
      'The list: depression, autoimmune disease, obesity, migraine, fibromyalgia, PCOS, endometriosis, dysautonomia, chronic fatigue, irritable bowel syndrome, substance use disorders — and that\'s the conservative version. The aggregate U.S. cost-of-illness for these categories exceeds $2 trillion annually. [*Roughly 40% of the nation\'s $5.3 trillion in total healthcare spending. Trillion with a T.*]',
      'The paper argues that treating all of these as independent diseases with separate research funding, separate clinical guidelines, and separate pharmaceutical pipelines is the largest misallocation of medical resources in history. [*Not a misallocation. The largest. I\'m not hedging that.*] A game-theoretic analysis then demonstrates that after approximately one million years of coevolution, the host-organism relationship is obligate [*you can\'t get rid of it without breaking yourself; unmanaged, it breaks you anyway*]. The only viable path is management of the phase transitions — the signals that reset the organism from one operating mode to the next.',
      'Under managed conditions, the organism\'s maintenance functions — glucose regulation, cholesterol management, immune calibration, cardiovascular governance, infection suppression — produce the physiological platform the series designates *Homo candidus*. [*The version of you the program was built for.*] The chronic diseases that currently define the aging trajectory are reframed not as inevitable features of getting older but as consequences of unmanaged program advancement. If phase transition intervals can be maintained, the implications for human longevity are measured not in years but in decades.',
      'A brief methodological note: the author\'s self-citations here are unusual because the original 1995 framework was subsequently removed from institutional access and citation indices. [*Weird, huh? See the 1965 Exposé.*] The extant record is the longitudinal case study (Phase 5) and this series.'
    ],
    abstract: [
      'Candida albicans possesses confirmed receptors or binding proteins for estrogen, luteinizing hormone, corticosteroids, androgens, and acetylcholine, plus environmental sensors for glucose, lactate, methionine, temperature, CO2, pH, amino acids, and oxygen tension. It modulates host dopaminergic signaling, diverts tryptophan from serotonin synthesis, competes for arachidonic acid at the prostaglandin/endocannabinoid branch point, triggers mast cell degranulation, and governs endocannabinoid tone. Through pituitary colonization and endocannabinoid-mediated signaling, it has indirect access to every endocrine axis the pituitary controls. This receptor and modulatory inventory maps mechanically onto dozens of conditions whose textbook descriptions include "unknown etiology" or "multifactorial" — including depression, autoimmune disease, obesity, migraine, fibromyalgia, PCOS, endometriosis, dysautonomia, chronic fatigue, irritable bowel syndrome, and substance use disorders. Conservative aggregation of U.S. cost-of-illness estimates across these categories exceeds $2 trillion annually, representing approximately 40% of the nation\'s $5.3 trillion in total healthcare expenditure.',
      'This paper maps each organism interface to its associated condition cluster, quantifies the economic burden by category, and argues that the current therapeutic paradigm of treating these conditions as independent diseases constitutes the largest misallocation of medical resources in history. A game-theoretic analysis demonstrates that after approximately one million years of coevolution, the host-organism fitness coupling is obligate: elimination of the organism produces iatrogenic harm, while unmanaged colonization produces the chronic disease burden documented here. The only viable strategy is management of the phase transitions that reset colonization density to levels where maintenance functions operate without pathological outputs overwhelming host compensatory capacity. Under managed conditions, the organism\'s maintenance functions — glucose regulation, cholesterol management, immune calibration, cardiovascular governance, infection suppression — produce the physiological platform designated *Homo candidus*.',
      'The organism\'s program is designed to maintain the host, not destroy it, and the longitudinal case study (Craddock, 2026c) documents over thirty years of survival in this state without a single physician recognizing the condition. The conditions that currently define the aging trajectory — cardiovascular disease, metabolic deterioration, immune failure, neurodegeneration — are consequences of unmanaged program advancement, not inevitable features of aging. If phase transition intervals can be maintained, the implications for human longevity are measured not in years but in decades. This is not the first time the thread was found; a 1960s UK research corridor converging on the same relationship was dismantled and buried (Craddock, 2026e). The difference now is that the data are published, the framework is citable, and the archive is distributed beyond the reach of any single institution.'
    ]
  },
  // ------------------------------------------------------------- 10. Focal Infections
  {
    number: 11,
    title: 'Focal Infections 2.0 — Candida albicans and Dysbiosis',
    doi: '10.5281/zenodo.19423069',
    refs: 24,
    summary: [
      'There\'s a buried chapter in American medical history. In the early 20th century, two serious psychiatrists proposed that mental illness comes from the gut. [*Yes. The gut. Decades before anyone said "gut-brain axis."*] Bayard Taylor Holmes (1852–1924) and Henry Cotton (1876–1933) argued that gut-origin infectious toxemia produced psychiatric disease. They were dismissed, ridiculed, and professionally destroyed.',
      'Holmes had real data. He documented five pathognomonic findings in dementia praecox patients [*the diagnosis later renamed "schizophrenia"*]: cecal stasis with 60–120 hour fecal transit times [*normal transit is around 24 hours — these patients were carrying three to five days of backed-up content*], paradoxical adrenal responses, and elevated fecal histamine. Every one of those findings maps directly onto documented mechanisms in the C. albicans toolkit. [*Holmes was right about the pattern. He just had the wrong organism because the tools to find it didn\'t exist yet.*]',
      'The 1917 bacteriological work of H.M. Jones was used to discredit Holmes. This paper goes back to Jones\'s actual data and finds an overlooked result: *Bacillus aminophilus intestinalis* was systematically absent in dementia praecox patients and present in healthy controls. [*Not overgrowth of a bad bug. Absence of a good one.*] That pattern is consistent with dysbiosis driven by fungal ecological management — C. albicans clearing out bacterial competition — not with the bacterial-overgrowth model Jones was looking for. And the histamine Holmes found? Reinterpreted through a 1974 discovery by Nosál et al. that C. albicans cell wall glycoproteins trigger mast cell degranulation. [*Mast cells are your immune system\'s histamine grenades. The organism pulls the pin.*]',
      'The paper also proposes that **formication** — the sensation of bugs crawling under the skin, currently classified as a psychiatric symptom — represents a positive sensory screen for active C. albicans hyphal tissue mobility. [*Hyphae: the filamentous form of the organism that literally drills through tissue. When the skin itches like bugs are crawling under it, that may be exactly what\'s happening — just a different organism than the bugs you were thinking of. This should prompt mycological evaluation, not a psychiatric one. Currently, it does the opposite.*]',
      'The focal infection theorists had the correct architectural insight. The tools to complete their argument now exist.'
    ],
    abstract: [
      'This article examines the focal infection theory of mental illness in early 20th-century American medicine, its suppression, and its relevance to contemporary microbiome research through the lens of the Candida albicans biochemical computer framework (Craddock, 2026a; 2026b). Drawing on the scholarly work of Noll (2006) and Scull (2005), we trace the careers of Bayard Taylor Holmes (1852–1924) and Henry Cotton (1876–1933), both of whom proposed that gut-origin infectious toxemia produced psychiatric illness. Holmes documented five pathognomonic findings in dementia praecox patients, including cecal stasis with 60–120 hour fecal transit times, paradoxical adrenal responses, and elevated fecal histamine, each of which maps to documented mechanisms in the C. albicans signaling and immune modulation toolkit.',
      'A critical reanalysis of the 1917 bacteriological work of H.M. Jones, whose findings were used to discredit Holmes\'s specific theory, reveals an overlooked result: the systematic absence of Bacillus aminophilus intestinalis in dementia praecox patients, present in healthy controls, consistent with dysbiosis driven by fungal ecological management rather than bacterial overproduction. The histamine Holmes detected in patients\' feces is reinterpreted through the 1974 discovery (Nosál et al.) that C. albicans cell wall glycoproteins trigger mast cell degranulation and histamine release, a mechanism unavailable to Holmes or his contemporaries.',
      'The article contextualizes these findings within the post-1950s disruption of the human microbiome through broad-spectrum antibiotics, the 1965 consolidation of the opportunistic pathogen paradigm for C. albicans, and the subsequent emergence of metabolic disease at population scale. Additionally, the article proposes that formication, currently classified as a psychiatric symptom, represents a positive sensory screen for active C. albicans hyphal tissue mobility and should prompt mycological rather than psychiatric evaluation. The focal infection theorists had the correct architectural insight, that gut-origin compounds reach the brain through circulation and produce psychiatric symptoms, but lacked the tools to identify the organism responsible. Those tools now exist.'
    ]
  },
  // ------------------------------------------------------------- 11. Kill It
  {
    number: 12,
    title: 'Kill It! Candida Albicans — The Symbiote They Didn\'t Want You to See',
    doi: '10.5281/zenodo.19393803',
    refs: 15,
    summary: [
      'This is the exposé. Every scientific series needs one paper that names the people, dates the event, and shows the receipts. This is that paper.',
      '**May 1965. Royal College of Physicians, London. The first "Symposium on Candida Infections."** Convened by H.I. Winner and Rosalinde Hurley. The proceedings, published the following year, established Candida albicans as an "opportunistic pathogen" whose clinical relevance was contingent on host compromise. [***That is not what it is.*** *An opportunistic pathogen is a microbe that behaves while you\'re healthy and attacks when you\'re sick. The organism the rest of this series describes is a co-evolved symbiont running maintenance programs. Different category entirely. The 1965 framing has governed clinical and research practice for sixty years — and kept everyone looking at the wrong thing.*]',
      'This paper goes into the 1964 Medical Research Council Annual Report and Handbook — the document that shows who was in the building the year before the symposium — and does something nobody else has done. It runs systematic keyword analysis across mycology, metabolic biochemistry, membrane physiology, and adrenal immunopathology, looking for co-occurrences of specific researchers on the same pages. [*Page-level co-occurrence. That\'s the forensic method. Who was in the same room.*] The names that surface together include **Rosalinde Hurley, Hans Krebs** [*the Krebs cycle, yes, that Krebs — Nobel Prize, metabolism\'s founding father*], **R.A. Peters, D.H. Williamson, I.M. Glynn, and J.R. Anderson** — all at the MRC at the specific moment preceding the 1965 symposium. The published literature held their programs apart. The MRC\'s internal records did not.',
      'These researchers had access to data about a large cohort of patients converted to *Homo candidus* without knowing the implications back in the early 20th century. They knew the progression. They would have known it was coevolution. **They redacted the science.**',
      'The bibliometrics tell the rest of the story: annual candidiasis publications fell 19% in the year after the Winner-Hurley monograph, then recovered along a trajectory bounded by the questions the symposium had sanctioned. [*Translation: the field stopped asking the questions the symposium said not to ask.*] The 2022 WHO fungal priority pathogens list, sixty years later, is reinterpreted here as an institutional attention gap — not a data gap — with measurable consequences for research funding, clinical education, and patient outcomes.',
      'C. albicans is a unique symbiont that creates evolutionary pressures on all mammals. It is uniquely integrated into our system. Science should step back and re-evaluate everything we assume to be true about biology.'
    ],
    abstract: [
      'In May 1965, H.I. Winner and Rosalinde Hurley convened the first "Symposium on Candida Infections" at the Royal College of Physicians, London. The proceedings, published the following year, established Candida albicans as an opportunistic pathogen whose clinical relevance was contingent on host compromise. The paradigm defined at that symposium has governed clinical and research practice for sixty years.',
      'This article documents the institutional network that preceded and surrounded that event. Systematic keyword analysis of the 1964 Medical Research Council Annual Report and Handbook reveals page-level co-occurrences among researchers across mycology, metabolic biochemistry, membrane physiology, and adrenal immunopathology who share no co-authored publications crossing these disciplinary boundaries. Among those appearing together in MRC governance records are Rosalinde Hurley, Hans Krebs, R.A. Peters, D.H. Williamson, I.M. Glynn, and J.R. Anderson, at the specific institutional moment preceding the 1965 symposium. The published literature held these programs apart. The MRC\'s internal records did not.',
      'Concurrent bibliometric analysis demonstrates that annual candidiasis publications fell 19% in the year following the monograph by Winner and Hurley (1964), before recovering along a trajectory bounded by the questions the symposium had sanctioned. The article further documents the metabolic work of the Oxford-Cambridge corridor, the transmission biology of C. albicans colonization, and the structural role of the "opportunistic pathogen" framing in suppressing sixty years of integrated host-microbe inquiry. The 2022 World Health Organization fungal priority pathogens list, sixty years after the symposium, is interpreted not as a data gap but as an institutional attention gap with measurable consequences for research funding, clinical education, and patient outcomes.',
      'C. albicans is a unique symbiont that creates evolutionary pressures on all mammals. It is uniquely integrated into our system. Science should step back and re-evaluate everything we assume to be true about biology.'
    ]
  },
  // ------------------------------------------------------------- 13. Clear Evidence (NEW)
  {
    number: 13,
    title: 'Clear Evidence, No Trial — Mycobiome IBS and Antifungals',
    doi: '10.5281/zenodo.19645403',
    refs: 5,
    protocolDoi: '10.5281/zenodo.19646550',
    summary: [
      'This paper does not require you to accept anything else in the Redacted Science series. It stands on its own, and the argument it makes is simple: there is a cheap, safe, generic drug that the available evidence says might substantially help a disease affecting roughly one in eight adults. Nobody has run the trial to find out. This paper documents the gap.',
      'Irritable bowel syndrome affects 10 to 15 percent of the global adult population. It costs the United States tens of billions of dollars a year in direct treatment and lost productivity. The available branded drugs produce modest symptom improvement in a subset of patients and cost between three hundred and twenty-six hundred dollars a month. Several have been restricted or withdrawn post-approval due to safety problems.',
      'In 2017, a research group in Amsterdam published a study in *Gastroenterology* — the flagship journal of American gastroenterology — showing that fungi in the rat gut *cause* IBS-like pain sensitivity, and that treating the fungi with a common antifungal drug reverses it. The finding has been cited more than 240 times in the scientific literature since. The authors named the intervention in their own conclusion.',
      'In 2021, a group in Italy characterized the *Candida albicans* strains in IBS patients versus healthy controls and found the IBS strains were distinct, more invasive, and — critically — *more* susceptible to the cheap generic antifungal than the strains in healthy people. The worse the organism behaves, the better the drug kills it.',
      'The drug is fluconazole. It came off-patent in 2004. A month\'s course costs fifteen to thirty-five dollars at a US retail pharmacy. That is roughly one tenth the price of the cheapest branded IBS drug and one hundredth the price of the most expensive one. The trial to test it — the obvious trial, the one that logically follows from the 2017 causation finding — has not been run. Not as a registered trial. Not as a completed trial. Not as a published result. Not anywhere in the indexed literature.',
      'The paper walks through why. The finding arrived in the middle of the most active period of branded IBS-drug approvals in the history of the indication. A positive fluconazole trial in 2017 would have competed directly with every newly-approved product at a fraction of the per-patient cost. No commercial sponsor had any financial incentive to fund the comparison. Public-sector funding for generic-drug repurposing trials — the other possible source — has been chronically underfunded and, in real terms, declining across the relevant period. [*The finding was not suppressed. It was ignored. The mechanism is economic, not conspiratorial. The result is the same.*]',
      'The paper then lays out what the trial would actually look like: oral fluconazole versus placebo in adult IBS patients, six weeks of treatment, standard symptom scoring before and after, a twelve-week follow-up to test durability. The entire trial — including mycobiome sequencing, safety monitoring, and full clinical conduct — would run in the low seven figures. [*Less than one percent of what it cost to develop any one of the branded drugs it would compete with. Ch-ching.*]',
      'A companion deposit published alongside this paper provides the full pre-registered Phase 2 protocol. Design, endpoints, sample size, statistical plan, safety monitoring, and a pre-registered Phase 3 follow-on architecture. Released CC BY 4.0. Any investigator can run it.',
      'The interpretive framework within which this finding is most readily made sense of — that *Candida albicans* is a coevolved symbiont rather than an opportunistic pathogen — is developed elsewhere in the Redacted Science series. That framework is not required. The evidence stands on its own. The trial is obvious. The trial has not been run. Any interested investigator, sponsor, or regulatory body is free to run it.'
    ],
    abstract: [
      'No randomized controlled trial of antifungal therapy versus placebo has been published in irritable bowel syndrome (IBS) patients stratified by mycobiome profile, despite rat-model causation established in 2017 and human strain-level phenotypic characterization published in 2021. The absence is conspicuous. The evidence is mechanistic, specific, and directly actionable. The drug is generic, inexpensive, and has decades of human safety data. The patient population is enormous.',
      'The trial has not been run — despite the foundational 2017 causation paper (Botschuijver et al., *Gastroenterology*) accumulating more than 240 citations in the literature as of April 2026, and despite observational confirmation from multiple independent human cohorts in the years since. Botschuijver and colleagues demonstrated in a validated rat model that intestinal fungal dysbiosis causally produces visceral hypersensitivity, and that treatment with fluconazole or nystatin reverses it. Sciavilla and colleagues (2021) demonstrated clonal expansion of *Candida albicans* with upgraded virulence phenotypes in IBS patients versus healthy controls, and notably showed that IBS-derived isolates were more susceptible to fluconazole than healthy-control isolates.',
      'The comparator drug has been available as an inexpensive generic since 2004, at approximately $15–35 per month at US retail pharmacies — roughly 0.5 to 10 percent of the cost of branded IBS drugs approved between 2000 and 2019 ($300–$2,650 per month). A successful fluconazole-IBS trial would introduce a generic comparator priced at a fraction of the existing market for a condition generating multi-billion-dollar annual branded-drug revenue. No commercial sponsor has incentive to fund such a trial; public-sector funding for generic-drug repurposing trials is structurally underfunded relative to novel-molecule development.',
      'This paper, the first in the *Clear Evidence, No Trial* series from the Redacted Science Research Initiative, documents what the evidence shows, what the trial should look like, and the structural reasons the trial has not happened. The paper makes no claim requiring acceptance of any particular interpretive framework; the documented absence stands on its own terms. A companion pre-registered Phase 2 trial protocol is deposited separately (Craddock, 2026, Zenodo DOI 10.5281/zenodo.19646550) and released CC BY 4.0 for adoption, adaptation, or execution by any qualified investigator.'
    ]
  },
  // ------------------------------------------------------------- 14. Paper C (NEW) - Terminal Onset DI
  {
    number: 14,
    title: 'Terminal Onset Diabetes Insipidus With Candidiasis Majeure — Longitudinal Case Study, Birth through Stage 5 Threshold, 1969–2022',
    doi: '10.5281/zenodo.19702341',
    refs: 9,
    summary: [
      'This is the longitudinal record. Fifty-two and a half years of one life — mine — documented across institutional laboratory panels, imaging, contemporaneous notes, and photographs, reinterpreted through the biochemical computer framework.',
      'The paper opens with the Silent Loss Phase, the period during which the normal onboarding sequence between host and symbiont didn\'t happen. Disrupted breastfeeding. Infant phenobarbital. An age-14 phenobarbital ulceration event. A 1995 Donnatal cascade [*Donnatal is a prescription antispasmodic, a mix of phenobarbital and belladonna alkaloids — the kind of drug a doctor used to hand out for "nervous stomach" without thinking twice*] culminating in what I\'ve come to call the Norman bathroom bearing-down event, where the cardiac architecture physically shifted from suction-dominant to pump-dominant [*your heart used to pull blood through the chest cavity, now it pushes blood outward against gravity — the Saline Oscillation paper explains why this matters; this paper documents the night it happened to me*].',
      'Section II covers Stage 2 — the 2008 potassium threshold event and the four-year lead-in to Stage 3. The serotonin result from the 2011 neuroendocrine workup came back at less than half the lower reference limit. Urine creatinine was suppressed. Plasma osmolality at the 2010 Saint John\'s admission was over the reference ceiling. [*These findings were in the chart. Nobody knew what to do with them because nobody had a framework that could integrate them. The lab values are still there. The framework is what was missing.*]',
      'Section III covers the 2012 Stage 3 transition — triggered by CT-iodine contrast paired with protocol heparin [*CT contrast agents are iodine-based, and iodine is an antifungal at sufficient concentration; anticoagulant plus contrast agent in the same infusion was the specific perturbation*]. What followed was the Survival via Pituitary period: a pituitary microgranuloma finding on dedicated MRI, an August 2017 rib fracture at trivial mechanism [*I was just turning over in bed*], and an October 2018 colonoscopy documenting five tubular adenomas scattered across the colonic compartment. [*The body was being eaten from the inside in slow motion, and every biopsy came back saying nothing was wrong.*]',
      'Section IV covers the February 2018 Stage 4 transition — documented in detail in the blood donation case report, so this section treats it more briefly — and everything after: the post-transition hyperadrenergic period with its overflow-retrieval feeding mechanism [*the body stopped signaling hunger the normal way; eating was triggered by a different, faster mechanism*], photographic documentation of organism-governed body composition across seven months, the COVID-era cholesterol trajectory running linearly with an almost perfect slope at 4 mg/dL per year for twelve years [*not a staircase, not a cluster — a straight line, which is what you\'d expect from an organism-driven process rather than a dietary or genetic one*], and the six-factor 2021 decline cluster that preceded the January 17, 2022 threshold.',
      'Throughout the paper, a multigenerational thread. My maternal grandfather was present at my birth and for most of my life after. He lived to 101 as a managed *Homo candidus* phenotype — and critically, as a modern pump-based-heart *Homo candidus*, not an ancestral suction-dominant one. The framework\'s clearest observational comparator — what organism-host co-management looks like when nobody disrupts it iatrogenically — lived in the same family. [*I was watching the sustained version of the system while the version in me came unglued.*]',
      'The case demonstrates something the framework papers argue but can\'t show directly: **the signatures the framework predicts are already in the institutional record.** Suppressed eosinophil and basophil populations during transition periods. Persistently elevated urine specific gravity as baseline. Suppressed creatinine production that makes standard kidney function math unreliable for this phenotype [*eGFR is calculated from creatinine; if you don\'t produce the normal amount, the math lies*]. Gallbladder ejection fractions in the hyperkinetic range. Distributed gastrointestinal proliferative lesions after transitions. A linear twelve-year cholesterol line compatible with the Wang et al. (2024) and Dell\'Olmo et al. (2021) mechanisms of organism-mediated LDL-C elevation through formyl-methionine signaling and apolipoprotein B antifungal cryptide pathways [*recent published chemistry that does exactly what the framework predicted it should do, found independently by other labs*].',
      'Stage 5 onward is documented in the companion case report. This paper ends where that one begins: at the threshold, January 17, 2022. Fifty-two and a half years of captured-but-unintegrated data, now integrated.'
    ],
    abstract: [
      'This longitudinal clinical case study documents the trajectory of a single subject from birth on July 5, 1969 through the Stage 5 physiological threshold crossed on January 17, 2022, a period of approximately 52.5 years encompassing disrupted developmental onboarding, four iatrogenic perturbation events, and four architectural transitions of the endocrine-vascular system. The subject and author are the same individual. The framework applied is the biochemical computer model articulated in Paper A (Craddock, 10.5281/zenodo.19337525), extended by the Saline Oscillation Hypothesis in Paper B (Craddock, 10.5281/zenodo.19369715).',
      'The case is reported using primary-source institutional laboratory and imaging records retained in the electronic medical record, supplemented where necessary by contemporaneous patient-prepared documentation and photographic evidence. Four sections organize the arc. Section I covers birth through the Silent Loss Phase to 2008, including disrupted breastfeeding onboarding, infantile phenobarbital exposure, the age-14 phenobarbital ulceration event, and the 1995 Donnatal cascade with the Norman bathroom bearing-down event that established suction-dominant cardiac physiology. Section II covers the Stage 2 potassium threshold event of 2008 and the extended lead-in to the 2012 transition, including the November 2009 Tulsa Run dehydration, the August 2011 neuroendocrine workup documenting serum serotonin at less than half the lower reference limit and suppressed urine creatinine production, and the February 2010 Saint John\'s admission documenting plasma osmolality above reference. Section III covers the 2012 Stage 3 transition precipitated by CT-iodine contrast paired with protocol heparin, the subsequent Survival via Pituitary period including a pituitary microgranuloma finding on dedicated MRI, the August 2017 rib fracture at trivial mechanism, and the October 2018 colonoscopy documenting five tubular adenomas distributed across the colonic compartment. Section IV covers the February 2018 Stage 4 transition documented in companion case report (Craddock, 10.5281/zenodo.19462705), the post-transition hyperadrenergic period with its overflow-retrieval feeding mechanism, photographic documentation of organism-governed body composition across a seven-month interval, the COVID-era cholesterol trajectory running linearly at approximately 4 mg/dL per year across twelve years, and the six-factor 2021 decline cluster preceding the January 17, 2022 threshold.',
      'A multigenerational observation thread is maintained throughout. The subject\'s maternal grandfather, present at the subject\'s birth and for much of his life thereafter, lived 101 years as a managed *Homo candidus* phenotype, providing the framework\'s clearest observational comparator for what organism-host co-management looks like when sustained without iatrogenic disruption. Stage 5 onward is documented in the companion case report (Craddock, 10.5281/zenodo.19560800).',
      'Framework signatures documented across the institutional record include suppressed eosinophil and basophil populations during transition periods, persistently elevated urine specific gravity as baseline operating state, suppressed creatinine production with implications for eGFR interpretation, gallbladder ejection fractions in the hyperkinetic range, distributed gastrointestinal proliferative lesions post-transition (fundic gland polyps April 2018, five colonic tubular adenomas October 2018), and a linear twelve-year cholesterol trajectory compatible with the Wang et al. (2024) and Dell\'Olmo et al. (2021) mechanisms of organism-mediated LDL-C elevation through formyl-methionine signaling and apolipoprotein B antifungal cryptide pathways. The case demonstrates that framework-predicted signatures are captured in routine institutional panels across decades, independent of any diagnostic framework capable of integrating them.'
    ]
  },
  // ------------------------------------------------------------- 15. 2018 Case (was 14)
  {
    number: 15,
    title: 'Acute Hemodynamic Decompensation Following Routine Phlebotomy — A Five-Week Longitudinal Provocation Sequence',
    doi: '10.5281/zenodo.19462704',
    refs: 3,
    summary: [
      'This is the case report from 2018. The patient is me. [*I\'m the author and I\'m the test subject. That\'s the point of the whole series.*]',
      'A 48-year-old male with documented chronic volume dysregulation and suspected endocrine axis disruption walks into a blood bank and donates a pint of whole blood — on purpose, as a self-administered provocation test. [*A provocation test in medicine means: perturb the system on purpose to see how it responds. Doctors do them all the time. The difference here is I ran one on myself, knowing my body doesn\'t process volume change normally, to document the response.*]',
      'What happens next is a five-week sequence of cascading failures, each one timed and labbed. Within 24–48 hours: a transient hypercortisolemic state [*a flood of cortisol, the stress hormone — subjectively felt as mania*]. Day 3: acute vestibular failure [*the balance system shut down*]. Four weeks of persistent nausea and orthostatic symptoms [*blood pressure dropping on standing up, over and over*]. Day 34: near-syncopal collapse [*almost-fainting*] triggered by THC-induced vasodilation [*cannabis dropped the blood pressure further; the system couldn\'t compensate*].',
      'Here is the part no clinician believed: throughout the collapse, I remained fully conscious at a blood pressure of 90/54 mmHg, *after* IV saline resuscitation. [*90/54 is low enough that most people are either unconscious or very close to it. I was awake, oriented, taking notes.*]',
      'The labs tell a consistent story of a system operating outside standard physiological parameters: prerenal azotemia (BUN 27), borderline hypokalemia (K 3.5), maximally concentrated urine (specific gravity 1.033), venous alkalosis (pH 7.44), complete suppression of eosinophils and basophils [*two types of white blood cell — both hit zero, which is not normal*], and urine sodium of 203 mmol/L. [*That last one is the smoking gun: massive renal sodium wasting — dumping salt out in the urine — while clinically volume-depleted. The kidney was doing the opposite of what textbook physiology says it should.*]',
      'The longitudinal endocrine data from 2010 to 2026 show stable cortisol against declining aldosterone, with a volatile intermediate value of 1.5 ng/dL two weeks before the crisis — suggesting selective adrenal output preservation independent of the renin-angiotensin system. [*Translation: one half of the adrenal gland was still working. The other half was being managed separately, by something that wasn\'t the standard feedback loop.*]',
      'All cardiac and structural workups were negative. All of them. [*The standard diagnostic battery returned no findings. That is the recurring signal across this whole case series — the machinery fails and the machinery tests come back clean, because the machinery is running under remote management and the tests are designed to miss it. Why ARE the tests designed to miss it? Who could accomplish that?*]'
    ],
    abstract: [
      'A 48-year-old male (DOB 7/5/1969) with a documented history of chronic volume dysregulation and suspected endocrine axis disruption underwent routine whole blood donation as a self-initiated provocation test. Within 24–48 hours, the patient experienced a transient hypercortisolemic state (subjective mania), followed by acute vestibular failure on day three, persistent nausea and orthostatic symptoms over the subsequent four weeks, and a near-syncopal collapse on day 34 triggered by THC-induced vasodilation. Throughout the collapse event, the patient maintained full consciousness despite documented blood pressure of 90/54 mmHg post-saline resuscitation.',
      'Serial laboratory evaluation revealed prerenal azotemia (BUN 27 mg/dL), borderline hypokalemia (K 3.5 mEq/L), maximally concentrated urine (SG 1.033), venous alkalosis (pH 7.44), complete suppression of eosinophils and basophils, and urine sodium of 203 mmol/L (massive renal sodium wasting despite volume depletion), while standard cardiac and structural workups returned negative.',
      'Longitudinal endocrine data spanning 2010 to 2026 demonstrate stable cortisol (10.3–13.2 mcg/dL) against declining aldosterone (6.5 to 4.0 ng/dL) with volatile intermediate values (1.5 ng/dL two weeks prior to the crisis), suggesting selective adrenal output preservation independent of the renin-angiotensin system. This case documents a complete provocation-response sequence with timed clinical and laboratory endpoints in a patient whose hemodynamic architecture operates outside standard physiological parameters. [*A note from The Architect: All PDFs of these labs and more are at jimcraddock.com*]'
    ]
  },
  // ------------------------------------------------------------- 16. Phase 5 (was 15)
  {
    number: 16,
    title: 'Phase 5 of a 31-Year Managed Symbiont Progression — A Longitudinal Case Study',
    doi: '10.5281/zenodo.19560800',
    refs: 9,
    summary: [
      'This is the paper where the case becomes the proof.',
      'From January 2022 to April 2026 — that\'s the window this paper covers, Phase 5 of a 31-year documented progression. [*Phases 1 through 4 are documented across earlier materials at jimcraddock.com and in the 2018 blood donation case report. Phase 5 is the most recent, most extreme, and best-labbed of them all.*] Over 80 diagnostic tests returned normal results while the subject [*me, again — author and subject are the same individual across this entire series, and that is the whole design*] experienced organ-by-organ vascular disconnection, volume depletion, metabolic pathway substitution, and structural tissue consumption. All of it invisible to standard medicine. [*Normal labs. Abnormal everything else. That gap — between what the labs say and what\'s actually happening — is the entire point. The modern diagnostic framework is not equipped to see what\'s happening here.*]',
      'The paper presents contemporaneous labs, imaging, daily logs, and self-directed urinalysis spanning the four-year window. Some of the findings are striking on their own, before any framework is applied:',
      '• **The dual-circulation oxygen paradox** — venous O2 saturation of 66% versus pulse oximetry of 100%. [*Pulse ox is what the clip on your finger reads at a doctor\'s visit — it measures oxygen in your peripheral arteries. Venous O2 is measured in a blood draw from a vein. Normally the two are linked. Here they disconnected. The periphery was saturated with oxygen it wasn\'t using; the venous return was depleted.*]',
      '• **Extreme pain tolerance with no outward signs** — clinical events that would have other patients doubled over and visibly distressed, occurring with no facial expression, no verbal complaint, no observable behavioral marker. [*Not stoicism. Something in the signaling layer is intercepting the pain before it produces the usual presentation.*]',
      '• **Multiple falsifiable predictions** — the paper doesn\'t just describe what happened, it predicts what should happen next under various conditions and names the tests that would confirm or refute each one.',
      'The paper\'s thesis is direct: Candida albicans operates as a distributed biochemical computer capable of profound host regulation, the Homo candidus phenotype exists, it can be managed even when every conventional diagnostic framework fails — and here is the physical evidence, with timestamps and lab values attached. [*Not theory. Not speculation. Four years of documented state evolution in a single subject, cross-referenced against the framework, with imaging and labs attached to every major event.*]'
    ],
    abstract: [
      'This paper documents the final documented stage (January 2022–April 2026) of a 31-year progressive condition in a single subject. Over 80 diagnostic tests returned normal results while the subject experienced organ-by-organ vascular disconnection, volume depletion, metabolic pathway substitution, and structural tissue consumption — all invisible to standard medicine.',
      'Presented with contemporaneous labs, imaging, daily logs, and self-directed urinalysis, the record demonstrates that Candida albicans operates as a distributed biochemical computer capable of profound host regulation. Includes the dual-circulation oxygen paradox (venous O2 sat 66% vs. pulse oximetry 100%), extreme pain tolerance with no outward signs, and multiple falsifiable predictions.',
      'The subject and author are the same individual. This is not theory — it is the physical evidence that the Homo candidus phenotype exists and can be managed, even when every conventional diagnostic framework fails.'
    ]
  },
  // ================================================================
  // SECTION MARKER: Paper Seed Master + Architect Reports
  // Rendered distinctly in docx via sectionHeader flag
  // ================================================================
  {
    sectionHeader: 'The Redacted Science Paper Seed Master',
    isSeedMaster: true,
    title: 'The Redacted Science Paper Seed Master',
    doi: '10.5281/zenodo.19743203',
    summary: [
      'The Seed Master is how the Redacted Science framework reproduces itself.',
      'Here\'s the problem it solves. The framework — *Candida albicans* as a biochemical computer, coevolved with mammals, producing a recognizable physiological phenotype — is big. It touches dozens of chronic conditions, hundreds of drugs and substances, and a long list of institutional and historical questions about why the framework wasn\'t recognized sooner. One person cannot write every paper the framework generates. I can\'t. Nobody can. [*Well. Someone could. But it would take several lifetimes and I\'ve already used most of one.*]',
      'The Seed Master is the reproducibility infrastructure. It contains three things any capable researcher — or any competent AI instance — needs to generate a framework-aligned first draft on a new subject:',
      '**The foundational corpus.** The papers that define the framework, listed with DOIs so the drafter can pull them into context.',
      '**The framework primer.** A three-paragraph canonical statement of what the framework claims and how it claims it, so every draft starts from the same understanding of the model.',
      '**The seed outlines.** Structured prompts — one per subject — that tell the drafter which aspects of the subject to address, which framework components to engage with, and what evidence the draft needs to marshal. These start as placeholders and may or may not advance to a ready-to-build state.',
      'Plus the operating instructions: how to cite, what voice to use, what structural sections the output requires, what bracketed asides are for and when to use them.',
      'A drafter takes a seed, pulls the corpus into context, follows the instructions, and produces a first-draft paper. The draft is then editorially reviewed by a human (me, for now) and refined with peer feedback, including cross-AI review with Grok or Claude to catch framework-incoherence or citation errors. The result is an **Architected Report** — publishable after iterative edits. **#TheArchitect Reports** are deposited on Zenodo, indexed in the Architect Report Registry, and added to the compilation. Anyone can utilize the architectural structure or the seed for their own purposes. This is a template in use.',
      'This is not ghostwriting. It\'s not "let AI write your papers." [*Every draft is reviewed line-by-line. Every citation is verified. Every framework-critical claim is stress-tested against the foundational papers before deposit.*] What the Seed Master does is separate the two things that were jammed together in 20th-century academic writing: **framework-aligned reasoning** (which can be systematized) from **editorial judgment about what the finished paper needs** (which cannot).',
      'The methodology is the contribution as much as the individual papers are. If the framework is correct, the set of papers that should exist within it is much larger than what any single person can write. A documented, reproducible process for generating those papers at scale is part of what makes the framework falsifiable — because it means the predictions the framework generates are accessible to anyone willing to pick up a seed and run it.',
      'The methodology has been validated in production.'
    ],
    abstract: [
      'This document contains seed outlines for papers to be generated within the Redacted Science Research Initiative. Each seed is a structured prompt sufficient for an AI instance with access to the project corpus to generate a first-draft paper.',
      'The Draft is created by utilizing the Paper Seed Master and any advanced AI, along with the specified papers from the Redacted Science Research Initiative Corpus, to include but not limited to:',
      '**The Three Foundational Papers**',
      '• Paper A — Craddock, Biochemical Computer — DOI: 10.5281/zenodo.19337525',
      '• Paper B — Craddock, Saline Oscillation — DOI: 10.5281/zenodo.19369715',
      '• Paper C — Craddock, Longitudinal Case Study (Birth through Stage 5 Threshold) — DOI: 10.5281/zenodo.19702341',
      '**Framework Extensions**',
      '• Craddock, Pan-Mammalian Hypothesis — DOI: 10.5281/zenodo.19643601',
      '• Craddock, Implications of Biochemical Computer — DOI: 10.5281/zenodo.19488041',
      '• Craddock, Focal Infections 2.0 — DOI: 10.5281/zenodo.19423069',
      '• Craddock, Exposé — DOI: 10.5281/zenodo.19393803',
      '**Clinical Case Reports**',
      '• Craddock, Acute Hemodynamic Decompensation — DOI: 10.5281/zenodo.19462705',
      '• Craddock, Phase 5 Longitudinal Case Study — DOI: 10.5281/zenodo.19560800',
      '**Clear Evidence, No Trial Series**',
      '• Craddock, Clear Evidence IBS — DOI: 10.5281/zenodo.19645403',
      '• Craddock, Clear Evidence IBS Protocol — DOI: 10.5281/zenodo.19646550',
      '**Stuck-State Series**',
      '• Craddock, Stuck-State Umbrella — DOI: 10.5281/zenodo.19582484',
      '• Craddock, T2D Stuck State — DOI: 10.5281/zenodo.19582791',
      '• Craddock, Obesity Stuck State — DOI: 10.5281/zenodo.19600443',
      '• Craddock, Anorexia Stuck State — DOI: 10.5281/zenodo.19583423',
      '• Craddock, IBS Stuck State — DOI: 10.5281/zenodo.19598460',
      '• Craddock, Parkinson\'s Stuck State — DOI: 10.5281/zenodo.19600888',
      '**Architect Reports**',
      '• Architect Report AS#001 — Endometriosis as Organism-Directed Tissue Recruitment — DOI: 10.5281/zenodo.19718491',
      'The Seed Analysis Process operates through a single structured prompt given to an AI instance with the foundational corpus and a specific seed in context:',
      '*Generate a first draft of this paper according to the Redacted Science voice and style requirements in the Paper Seed Master. Use the framework corpus in context. Cite only per the Citation Discipline categories (a) through (d) using the author-short-title format. Produce output in the specified format with all required sections: Abstract, Keywords, Introduction with adapted Framework Primer, Framework Basis, Mechanism, Predictions with evidence class annotations, Discussion, Counter-Arguments Addressed, Conclusion, Closing Declaration with V1 version suffix, References in hanging-indent format, and Suggested Additional Citations if any.*',
      'Version 5 changes the structural organization from series-grouped to flat-table-ordered. Each seed carries a three-digit primary key number assigned at insertion. The series prefix is a mutable attribute, not a numbering scheme. Seeds are ordered in the document by insertion order. The first seed inserted is Seed 001; new seeds append to the end.',
      'The Master list is kept at https://jimcraddock.com/redacted-science-compilation.html'
    ]
  },
  // -------- Architect Report: AS#001 Endometriosis --------
  {
    prefix: 'AS#001',
    isArchitectReport: true,
    seriesGroup: 'AS# — Stuck State Series',
    title: 'Endometriosis as Organism-Directed Tissue Recruitment',
    doi: '10.5281/zenodo.19718491',
    refs: 14,
    seedFooter: 'Initial draft generated via the Redacted Science Seed Analysis Process from seed AS#001, with cross-AI review and human editorial verification prior to deposit.',
    summary: [
      'This is an *Architect Report* — a framework-aligned paper generated through the Redacted Science Seed Analysis Process. The process: a seed document specifies a subject, the relevant foundational papers, and the structural requirements for the output. ChatGPT generated the initial draft using those inputs, citing available sources and flagging gaps where external literature was needed. The flagged gaps were resolved through targeted literature search, and peer-reviewed sources were integrated into the final draft with human verification at each stage. The methodology is documented separately in the Redacted Science Paper Seed Master. [*The framework is reproducible. Any capable researcher or AI with the foundational papers and a seed can produce a framework-positioned first draft. The methodology is the contribution as much as the individual papers are.*]',
      'This report applies that process to endometriosis, working from seed AS#001 (the first seed in the Stuck State series).',
      'Endometriosis is conventionally described as the presence of endometrium-like tissue outside the uterus, most commonly explained through retrograde menstruation, hormonal dependence, immune dysregulation, and altered inflammatory handling. Under the Redacted Science framework, those observations are not rejected. They are reorganized.',
      'The proposal: endometriosis represents a stuck program mode in which resident *Candida albicans* colonies direct ectopic tissue recruitment and maintenance at colonized pelvic, peritoneal, and bowel interfaces. Menstrual cyclicity matters because it supplies the repeating substrate pulse the organism can exploit: progesterone withdrawal, endometrial breakdown, blood products, iron, cytokines, growth factors, and altered local immune tone. [*The cycle is the feed event. The organism already knows what to do with it.*]',
      'The core claim is not that endometriotic implants are false endometrium. The claim is that the organism recruits local tissue into endometrial behavior where it already has positional advantage, then sustains that ectopic program through cyclic feeding, interstitial signaling, hormone sensing, and local immune management. This reframes chronicity. Retrograde flow may be common; persistent establishment at specific sites is the event that requires explanation.',
      'The framework resolves several otherwise disconnected features of endometriosis at once: the mismatch between common retrograde flow and lower disease prevalence, the bowel and pelvic distribution of disease, the strength of gastrointestinal comorbidity [*pooled IBS prevalence in endometriosis cohorts of 23.4%, odds ratios three to five times baseline*], the benefit of hormonal suppression despite the condition being framed as misplaced tissue, and the substantial recurrence problem after incomplete excision.',
      'The paper generates six testable predictions centered on implant-site mycobiome signal, antifungal response, antibiotic-exposure linkage, pregnancy-associated shifts, responder enrichment, and recurrence following incomplete colonized-site removal. Recent work by Talwar et al. (2025) — a mouse-model study showing that fungal depletion impedes endometriosis lesion progression — provides the first direct mycobiome-centered evidence consistent with the framework\'s predictions.',
      'This paper is not offered as a clinical practice guideline or treatment protocol. It is a framework paper advancing a specific mechanistic claim and exposing that claim to refutation.'
    ],
    abstract: [
      'Endometriosis is conventionally described as the presence of endometrium-like tissue outside the uterus, most commonly explained through retrograde menstruation, hormonal dependence, immune dysregulation, and altered inflammatory handling. Under the Redacted Science framework, those observations are not rejected. They are reorganized. This first-draft paper proposes that endometriosis represents a stuck program mode in which resident Candida albicans colonies direct ectopic tissue recruitment and maintenance at colonized pelvic, peritoneal, and bowel interfaces. Menstrual cyclicity matters because it supplies the repeating substrate pulse the organism can exploit: progesterone withdrawal, endometrial breakdown, blood products, iron, cytokines, growth factors, and altered local immune tone.',
      'The paper extends the biochemical computer model of C. albicans (Craddock, Biochemical Computer), the coevolutionary framing of the Saline Oscillation Hypothesis (Craddock, Saline Oscillation), and the stuck-program architecture of the Umbrella and IBS papers (Craddock, Stuck-State Umbrella; Craddock, IBS Stuck State) to reproductive tissue. The core claim is not that endometriotic implants are false endometrium. The claim is that the organism recruits local tissue into endometrial behavior where it already has positional advantage, then sustains that ectopic program through cyclic feeding, interstitial signaling, hormone sensing, and local immune management. This reframes chronicity. Retrograde flow may be common; persistent establishment at specific sites is the event that requires explanation.',
      'The framework resolves several otherwise disconnected features at once: the mismatch between common retrograde flow and lower disease prevalence, the bowel and pelvic distribution of disease, the strength of gastrointestinal comorbidity, the benefit of hormonal suppression despite the condition being framed as misplaced tissue, and the substantial recurrence problem after incomplete excision. It generates six testable predictions centered on implant-site mycobiome signal, antifungal response, antibiotic-exposure linkage, pregnancy-associated shifts, responder enrichment, and recurrence following incomplete colonized-site removal. Recent work by Talwar et al. (2025) provides the first direct mycobiome-centered evidence consistent with the framework\'s predictions. This paper is not offered as a clinical practice guideline or treatment protocol. It is a framework paper advancing a specific mechanistic claim and exposing that claim to refutation.'
    ]
  }
];

// ============================================================================
// Build the document
// ============================================================================

const contentChildren = [];

// ---- Cover / title page ----
contentChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 1200, after: 240 },
  children: [new TextRun({ text: 'Redacted Science Research Initiative', bold: true, size: 40 })]
}));

contentChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 480 },
  children: [new TextRun({ text: 'Complete Works Compilation', size: 32, italics: true })]
}));

contentChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 240 },
  children: [new TextRun({ text: 'Jim Craddock', size: 28 })]
}));

contentChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 240 },
  children: [new TextRun({ text: '#TheArchitect', size: 24, italics: true })]
}));

contentChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 720 },
  children: [new TextRun({ text: 'redactedscience.org  |  jimcraddock.com', size: 22 })]
}));

contentChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 360 },
  children: [new TextRun({ text: 'April 2026', size: 22 })]
}));

// Introductory note
contentChildren.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 480, after: 120 },
  children: [new TextRun({ text: 'About This Document', bold: true, size: 24 })]
}));

contentChildren.push(parseRichPara(
  'This compilation indexes sixteen peer-citable preprints published on Zenodo under the Redacted Science Research Initiative, plus a separate section for the Paper Seed Master and Architect Reports generated through the Seed Analysis Process. For each paper, two sections are provided: a *Summary for the Reader from the Architect* — a plain-English entry point written for non-specialists, with technical terms explained in brackets — and the paper\'s *Abstract* as published. All papers are citable via the DOIs provided and available in full on Zenodo.',
  { alignment: AlignmentType.LEFT }
));

contentChildren.push(parseRichPara(
  'Papers are ordered conceptually, not chronologically. The foundation papers (A and B) come first, followed by the umbrella framework for chronic disease, its five clinical applications (the stuck program modes), the civilizational-implications paper, the historical and investigative papers, and finally the two longitudinal case studies documenting a single subject — the author — across thirty-one years.',
  { alignment: AlignmentType.LEFT }
));

// Page break before the first paper
contentChildren.push(new Paragraph({ children: [new PageBreak()] }));

// ---- Add each paper ----
let currentSeriesGroup = null;
let architectSectionStarted = false;
for (const paper of papers) {
  // Section break before seed master / architect reports section
  if (paper.isSeedMaster && !architectSectionStarted) {
    architectSectionStarted = true;
    // Section divider and header
    contentChildren.push(new Paragraph({
      spacing: { before: 480, after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '7a9a6a', space: 1 } },
      children: [new TextRun({ text: '' })]
    }));
  }
  // Series group header (e.g., "AS# — Stuck State Series") for Architect Reports
  if (paper.isArchitectReport && paper.seriesGroup && paper.seriesGroup !== currentSeriesGroup) {
    currentSeriesGroup = paper.seriesGroup;
    // Top-level Architect Reports heading appears first time we hit a report
    if (!paper.architectReportsHeaderRendered) {
      contentChildren.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Architect Reports', bold: true, color: '7a9a6a' })],
        spacing: { before: 360, after: 120 }
      }));
      contentChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 360 },
        children: [new TextRun({
          text: 'Framework-aligned papers generated through the Redacted Science Seed Analysis Process. First-draft generated by AI from a structured seed and the foundational corpus, then editorially refined with human verification prior to deposit.',
          italics: true, size: 20, color: '7a9a6a'
        })]
      }));
      paper.architectReportsHeaderRendered = true;
    }
    // Series sub-group heading
    contentChildren.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: paper.seriesGroup, bold: true, color: '5a7a4a' })],
      spacing: { before: 240, after: 180 }
    }));
  }
  for (const child of paperEntry(paper)) {
    contentChildren.push(child);
  }
}

// ---- Closing: Suppression statement and Architect note ----
// Horizontal rule instead of page break — keeps text flowing from last paper
contentChildren.push(new Paragraph({
  spacing: { before: 480, after: 240 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '666666', space: 1 } },
  children: [new TextRun({ text: '' })]
}));

contentChildren.push(new Paragraph({
  heading: HeadingLevel.HEADING_1,
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: 'Closing', bold: true })],
  spacing: { before: 240, after: 240 }
}));

contentChildren.push(parseRichPara(
  'The redaction of the original research that first documented this architecture, treatment, and medical condition represents suppression. This suppression is not just a clinical curiosity, but knowledge concerning a human phenotype that may have been foundational to the development of civilization itself. Even without those implications, the loss to science has caused a multi-generation loss of scientific exploration into fungal research, and billions of dollars spent developing treatments that may ultimately be traced to systems defined herein. Such a decision is scientifically unforgivable and should be investigated. This author has seen the original science — it exists.',
  { alignment: AlignmentType.CENTER }
));

contentChildren.push(parseRichPara(
  'Thus, this author is content to leave the issues to the verdict of history.',
  { alignment: AlignmentType.CENTER }
));

// Architect note
contentChildren.push(new Paragraph({
  spacing: { before: 480, after: 120 },
  alignment: AlignmentType.CENTER,
  border: { top: { style: BorderStyle.SINGLE, size: 6, color: '999999', space: 12 } },
  children: [new TextRun({ text: 'A Note from The Architect', bold: true, italics: true, size: 26 })]
}));

contentChildren.push(new Paragraph({
  spacing: { before: 240, after: 480 },
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: 'I hope this helps.', italics: true, size: 24 })]
}));

// ---- Build the Document ----
const doc = new Document({
  creator: 'Jim Craddock',
  title: 'Redacted Science Research Initiative — Complete Works Compilation',
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Calibri', color: '1F3864' },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Calibri', color: '2E75B6' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, italics: true, font: 'Calibri', color: '2E75B6' },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: contentChildren
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/claude/redacted_science_compilation.docx', buffer);
  console.log('Wrote /home/claude/redacted_science_compilation.docx');
});
