// frontend/src/utils/generatePDF.js
export async function generatePDF({ user, patient, result, imgBase64, imgFormat, gradcamSrc, comment }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210, MARGIN = 18, CW = 210 - 36;
  let y = 0;

  // Palette — plus claire, même thème
  const NAVY  = [15, 31, 61];
  const BLUE  = [59, 130, 246];
  const LBLUE = [147, 197, 253];
  const GRAY  = [75, 106, 155];
  const LIGHT = [226, 234, 248];
  const WHITE = [255, 255, 255];
  const diagColor = result.class === 'covid' ? [248,113,113] : result.class === 'normal' ? [74,222,128] : [251,191,36];

  // ── HEADER ───────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 36, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 34, W, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...WHITE);
  doc.text('RadioScan AI', MARGIN, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...LBLUE);
  doc.text('Plateforme de Diagnostic Radiologique — Intelligence Artificielle', MARGIN, 23);

  const now = new Date();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  doc.text('RAPPORT MÉDICAL CONFIDENTIEL', W - MARGIN, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...LBLUE);
  doc.text(`${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`, W-MARGIN, 19, { align:'right' });
  doc.text(`Réf: RSA-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}`, W-MARGIN, 26, { align:'right' });

  y = 44;

  // ── RADIOLOGUE ────────────────────────────────────────────────────
  doc.setFillColor(226, 234, 248);
  doc.roundedRect(MARGIN, y, CW, 17, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('RADIOLOGUE', MARGIN+6, y+6.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text(user.name, MARGIN+1, y+13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(user.role, MARGIN+6+doc.getTextWidth(user.name)+4, y+13);

  y += 24;

  // ── PATIENT ───────────────────────────────────────────────────────
  if (patient) {
    const boxH = 32;
    doc.setFillColor(15, 31, 61);
    doc.roundedRect(MARGIN, y, CW, boxH, 3, 3, 'F');
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN, y, CW, boxH, 3, 3, 'S');

    // LEFT column — identity
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...LBLUE);
    doc.text('PATIENT', MARGIN + 6, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...LIGHT);
    doc.text(`${patient.prenom} ${patient.nom}`.toUpperCase(), MARGIN + 6, y + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(`CIN : ${patient.cin}`, MARGIN + 6, y + 22);

    // Vertical separator
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.4);
    doc.line(MARGIN + CW * 0.38, y + 5, MARGIN + CW * 0.38, y + boxH - 5);

    // MIDDLE column
    const col2 = MARGIN + CW * 0.40;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    if (patient.dateNaissance) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...LBLUE);
      doc.text('Né(e) le', col2, y + 10);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...LIGHT);
      doc.text(patient.dateNaissance, col2 + 18, y + 10);
    }
    if (patient.sexe) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...LBLUE);
      doc.text('Sexe', col2, y + 19);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...LIGHT);
      doc.text(patient.sexe, col2 + 18, y + 19);
    }
    if (patient.telephone) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...LBLUE);
      doc.text('Tél', col2, y + 28);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...LIGHT);
      doc.text(patient.telephone, col2 + 18, y + 28);
    }

    // Vertical separator
    doc.setDrawColor(30, 58, 138);
    doc.line(MARGIN + CW * 0.68, y + 5, MARGIN + CW * 0.68, y + boxH - 5);

    // RIGHT column
    const col3 = MARGIN + CW * 0.70;
    if (patient.medecin) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...LBLUE);
      doc.text('Médecin traitant', col3, y + 10);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...LIGHT);
      doc.text(patient.medecin, col3, y + 19);
    }

    y += boxH + 8;
  }

  // ── SECTION TITLE helper ──────────────────────────────────────────
  const section = (title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BLUE);
    doc.text(title.toUpperCase(), MARGIN, y);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.35);
    doc.line(MARGIN + doc.getTextWidth(title.toUpperCase()) + 3, y - 0.5, MARGIN + CW, y - 0.5);
    y += 7;
  };

  // ── DIAGNOSTIC ───────────────────────────────────────────────────
  section('Résultat du Diagnostic IA');

  // Big diagnosis badge
  doc.setFillColor(...diagColor);
  doc.roundedRect(MARGIN, y, 62, 26, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text('DIAGNOSTIC', MARGIN+5, y+8);
  doc.setFontSize(15);
  doc.text(result.prediction, MARGIN+5, y+19);

  // Confidence
  doc.setFillColor(...LIGHT);
  doc.roundedRect(MARGIN+67, y, 38, 26, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('CONFIANCE', MARGIN+69, y+8);
  doc.setFontSize(19);
  doc.setTextColor(...diagColor);
  doc.text(`${result.confidence}%`, MARGIN+69, y+20);

  // Prob bars
  const pbX = MARGIN + 112;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(pbX, y, CW-112, 26, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('PROBABILITÉS', pbX+5, y+7);
  const classColors = { covid:[248,113,113], normal:[74,222,128], pneumonia:[251,191,36] };
  const classNames  = { covid:'COVID-19', normal:'Normal', pneumonia:'Pneumonie' };
  let pbY = y + 11;
  Object.entries(result.all_probabilities).forEach(([cls, prob]) => {
    const cc = classColors[cls] || BLUE;
    const bw = (CW-122) * prob / 100;
    doc.setFillColor(200, 210, 230);
    doc.roundedRect(pbX+5, pbY, CW-122, 3, 1, 1, 'F');
    if (bw > 0) { doc.setFillColor(...cc); doc.roundedRect(pbX+5, pbY, bw, 3, 1, 1, 'F'); }
    doc.setFont('helvetica', cls === result.class ? 'bold' : 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...NAVY);
    doc.text(`${classNames[cls]}: ${prob.toFixed(1)}%`, pbX+5, pbY-0.5);
    pbY += 6.5;
  });

  y += 33;

  // ── IMAGERIE — Original + Grad-CAM côte à côte ───────────────────
  section('Imagerie Radiologique — Original & Grad-CAM');

  const imgH = 85;
  const imgW = (CW - 6) / 2;

  // Image originale — base64 pur passé directement, jsPDF l'accepte toujours
  if (imgBase64) {
    try {
      doc.addImage(imgBase64, imgFormat || 'JPEG', MARGIN, y, imgW, imgH, undefined, 'FAST');
    } catch (e) {
      // fallback : essayer l'autre format
      try { doc.addImage(imgBase64, imgFormat === 'PNG' ? 'JPEG' : 'PNG', MARGIN, y, imgW, imgH, undefined, 'FAST'); } catch {}
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  doc.text('Radiographie originale', MARGIN, y + imgH + 5);

  // Grad-CAM — base64 pur extrait de gradcamSrc
  const gradX = MARGIN + imgW + 6;
  if (gradcamSrc) {
    try {
      doc.addImage(gradcamSrc, 'PNG', gradX, y, imgW, imgH, undefined, 'FAST');
    } catch {}
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  doc.text(`Grad-CAM — ${result.prediction}`, gradX, y + imgH + 5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.text(`Confiance : ${result.confidence}%  •  Zones rouges = activation maximale`, gradX, y + imgH + 10);

  y += imgH + 17;

  // ── COMMENTAIRE ───────────────────────────────────────────────────
  section('Observations du Radiologue');

  const lines = doc.splitTextToSize(
    comment && comment.trim() ? comment : '(Aucune observation renseignée)',
    CW - 12
  );
  const boxH = Math.max(20, lines.length * 5 + 10);
  doc.setFillColor(...LIGHT);
  doc.roundedRect(MARGIN, y, CW, boxH, 3, 3, 'F');
  doc.setFont('helvetica', comment && comment.trim() ? 'normal' : 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(lines, MARGIN+6, y+8);

  y += boxH + 10;

  // ── SIGNATURE ────────────────────────────────────────────────────
  doc.setDrawColor(180, 200, 230);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN+CW, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text(user.name, MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(user.role, MARGIN, y+5);
  doc.text(`Signé électroniquement — RadioScan AI — ${now.toLocaleDateString('fr-FR')}`, MARGIN, y+10);

  y += 18;

  // ── DISCLAIMER ───────────────────────────────────────────────────
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(MARGIN, y, CW, 16, 3, 3, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, y, CW, 16, 3, 3, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(146, 64, 14);
  doc.text('⚠  AVERTISSEMENT MÉDICAL', MARGIN+4, y+6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.3);
  doc.setTextColor(120, 53, 15);
  const disc = "Ce rapport est généré par un système IA à titre d'aide au diagnostic uniquement. Il ne remplace pas l'avis d'un médecin qualifié. Données confidentielles — usage clinique exclusif.";
  doc.text(doc.splitTextToSize(disc, CW-8), MARGIN+4, y+11);

  // ── FOOTER ───────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...NAVY);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text('RadioScan AI — Diagnostic Radiologique — Confidentiel', MARGIN, 292);
    doc.text(`Page ${i} / ${pages}`, W-MARGIN, 292, { align:'right' });
  }

  const fname = `RadioScan_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${user.username||'rapport'}.pdf`;
  doc.save(fname);
}