from pathlib import Path
import re, html, json
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT=Path('D:/VANGUARDIA/MIO')
OUT=ROOT/'output/pdf'
src=OUT/'informe_commentsold_viabilidad_mio.md'
pdf=OUT/'informe_commentsold_viabilidad_mio.pdf'
content=src.read_text(encoding='utf-8')
refs=dict(re.findall(r'^\[(S\d+)\]: (https?://\S+)$',content,re.M))
body=re.sub(r'^\[S\d+\]: .*$', '', content, flags=re.M)
for font,file in [('Arial','arial.ttf'),('ArialB','arialbd.ttf'),('ArialI','ariali.ttf'),('ArialBI','arialbi.ttf')]:
    pdfmetrics.registerFont(TTFont(font,'C:/Windows/Fonts/'+file))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='ArialB',italic='ArialI',boldItalic='ArialBI')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Text',fontName='Arial',fontSize=10,leading=14.4,spaceAfter=8,allowWidows=0,allowOrphans=0,textColor=colors.HexColor('#20242A')))
styles.add(ParagraphStyle(name='Chapter',fontName='ArialB',fontSize=16,leading=20,spaceBefore=17,spaceAfter=10,keepWithNext=True,textColor=colors.black))
styles.add(ParagraphStyle(name='Sub',fontName='ArialB',fontSize=12,leading=16,spaceBefore=12,spaceAfter=7,keepWithNext=True,textColor=colors.black))
styles.add(ParagraphStyle(name='Cell',fontName='Arial',fontSize=8.5,leading=11.6,spaceAfter=0))
styles.add(ParagraphStyle(name='HeadCell',fontName='ArialB',fontSize=8.5,leading=11.6,textColor=colors.white))
styles.add(ParagraphStyle(name='BulletText',parent=styles['Text'],leftIndent=13,firstLineIndent=-10,spaceAfter=6))
styles.add(ParagraphStyle(name='Source',parent=styles['Text'],fontSize=9,leading=12.5,spaceAfter=8))
styles.add(ParagraphStyle(name='CoverTitle',fontName='ArialB',fontSize=30,leading=36,textColor=colors.black,spaceAfter=22))
styles.add(ParagraphStyle(name='CoverSub',fontName='Arial',fontSize=16,leading=23,spaceAfter=22))
styles.add(ParagraphStyle(name='ContentsTitle',parent=styles['Chapter']))

def fmt(s):
    s=html.escape(s)
    s=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'\[(S\d+)\]',lambda m: '<link href="'+refs[m[1]]+'" color="#175C83">['+m[1]+']</link>',s)
    s=re.sub(r'<b>(S\d+)([^<]+)</b>',lambda m: '<b><link href="'+refs.get(m[1],'')+'" color="#175C83">'+m[1]+m[2]+'</link></b>',s)
    return s

class Report(SimpleDocTemplate):
    def afterFlowable(self,f):
        if isinstance(f,Paragraph) and f.style.name=='Chapter':
            text=f.getPlainText()
            key='chapter-'+text.split()[0]
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text,key,0,False)
            self.notify('TOCEntry',(0,text,self.page,key))

def footer(c,d):
    c.saveState()
    if d.page>1:
        c.setStrokeColor(colors.HexColor('#D9DDE1'))
        c.line(54,43,558,43)
        c.setFont('Arial',8)
        c.setFillColor(colors.HexColor('#5B6169'))
        c.drawString(54,30,'MIO | Investigación y viabilidad local | 8 octubre 2026')
        c.drawRightString(558,30,str(d.page))
    c.restoreState()

story=[]
story.append(Spacer(1,70))
story.append(Paragraph('CommentSold y la<br/>viabilidad de MIO<br/>en Honduras',styles['CoverTitle']))
story.append(Paragraph('Investigación histórica y plan de validación comercial',styles['CoverSub']))
story.append(Paragraph('Preparado para Tony Sosa<br/>8 de octubre de 2026',styles['Text']))
story.append(Spacer(1,35))
story.append(Paragraph('Una evaluación para decidir qué construir, qué probar y cuándo ampliar el proyecto.',styles['Text']))
story.append(Spacer(1,22))
story.append(Paragraph('<b>Lectura sugerida</b><br/>Capítulos 3 a 8 para estudiar CommentSold.<br/>Capítulos 9 a 13 para evaluar MIO y Honduras.<br/>Capítulos 14 a 22 para diseñar el piloto y tomar decisiones.',styles['Text']))
story.append(Spacer(1,15))
story.append(Paragraph('Fuentes enlazadas, supuestos económicos explícitos y diagnóstico basado en el proyecto actual. MIO no contempla alojar video.',styles['Text']))
story.append(PageBreak())
story.append(Paragraph('Contenido',styles['ContentsTitle']))
toc=TableOfContents()
toc.levelStyles=[ParagraphStyle(name='TOCLine',fontName='Arial',fontSize=9.5,leading=12,spaceBefore=0,spaceAfter=0,leftIndent=0,rightIndent=14)]
story.append(toc)
story.append(PageBreak())

lines=body.splitlines()
i=0
while i<len(lines):
    line=lines[i].strip()
    if not line or line.startswith('# ') or line.startswith('Investigación histórica') or line.startswith('Preparado para'):
        i+=1; continue
    if line.startswith('## '):
        story.append(Paragraph(fmt(line[3:]),styles['Chapter'])); i+=1;continue
    if line.startswith('### '):
        story.append(Paragraph(fmt(line[4:]),styles['Sub'])); i+=1;continue
    if line.startswith('|'):
        table_lines=[]
        while i<len(lines) and lines[i].strip().startswith('|'):
            row=[c.strip() for c in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?',c) for c in row):table_lines.append(row)
            i+=1
        cols=len(table_lines[0]); width=504
        if cols==3:weights=[0.23,0.39,0.38]
        elif cols==4:weights=[0.31,0.20,0.24,0.25]
        elif cols==5:weights=[0.16,0.16,0.25,0.17,0.26]
        else:weights=[1/cols]*cols
        if 'Plan publicado' in table_lines[0]:weights=[0.40,0.25,0.35]
        if 'Tiendas pagadoras' in table_lines[0] and cols==3:weights=[0.25,0.31,0.44]
        data=[[Paragraph(fmt(c),styles['HeadCell'] if ri==0 else styles['Cell']) for c in row] for ri,row in enumerate(table_lines)]
        t=Table(data,colWidths=[width*w for w in weights],repeatRows=1,hAlign='LEFT')
        t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#223D51')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F3F6F8')]),('GRID',(0,0),(-1,-1),0.5,colors.HexColor('#D9D9D9')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
        story.extend([Spacer(1,4),t,Spacer(1,11)])
        continue
    if line.startswith('- '):
        s=line[2:]
        style=styles['Source'] if s.startswith('**S') else styles['BulletText']
        story.append(Paragraph(('' if style.name=='Source' else '• ')+fmt(s),style));i+=1;continue
    para=[line];i+=1
    while i<len(lines) and lines[i].strip() and not lines[i].lstrip().startswith(('#','|','- ')):
        para.append(lines[i].strip());i+=1
    story.append(Paragraph(fmt(' '.join(para)),styles['Text']))

doc=Report(str(pdf),pagesize=letter,leftMargin=54,rightMargin=54,topMargin=48,bottomMargin=58,title='CommentSold y la viabilidad de MIO en Honduras',author='Informe preparado para Tony Sosa',pageCompression=1)
doc.multiBuild(story,onFirstPage=footer,onLaterPages=footer)
reader=PdfReader(pdf)
text='\n'.join(p.extract_text() or '' for p in reader.pages)
assert '83 tiendas' in text
assert '24 Archivos' in text
assert len(reader.pages)>10
for k in refs:
    assert '['+k+']' in body or '**'+k in body,k
stats={'pages':len(reader.pages),'words':len(re.findall(r'\b\w+\b',body)), 'sources':len(refs),'links':sum(len(p.get('/Annots',[])) for p in reader.pages),'pdf':str(pdf)}
(ROOT/'tmp/pdfs/report_check.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(stats,ensure_ascii=False))
