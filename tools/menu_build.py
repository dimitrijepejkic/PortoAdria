"""Builds the HTML menu section from the data below (transcribed from images/Menu.pdf, April 2026)
and injects it into index.html between <div id="menu" ...> and <!-- end menu -->.
usage: python menu_build.py <index.html>"""
import sys, html

NOTE_FULL = 'Zu allen Gerichten servieren wir Ihnen einen frischen Salat, Brot und unsere hausgemachten Saucen.'
NOTE = 'Zu allen Gerichten servieren wir Ihnen einen frischen Salat und unsere hausgemachten Saucen.'
NOTE_SMALL = 'Zu allen Gerichten servieren wir Ihnen einen kleinen Salat und unsere hausgemachten Saucen.'

# tab -> list of groups; group = (title, subtitle, note, items); item = (no, name, codes, desc, price)
MENU = [
 ('m-vorspeisen', 'Suppen & Vorspeisen', [
   ('Unsere hausgemachten Suppen', None, None, [
     ('01', 'Montenegro Suppe', '9,3', 'Hühnersuppe mit Gemüse', '5,90'),
     ('02', 'Pasulj', '9,3', 'Bohnensuppe „Balkanart“ mit Fleischbeilage', '6,90'),
   ]),
   ('Kalte Vorspeisen', None, None, [
     ('04', 'Tzatziki', None, 'hausgemacht', '5,50'),
     ('06', 'Oliven & Peperoni', '10', 'mild', '6,50'),
   ]),
   ('Warme Vorspeisen', None, None, [
     ('07', 'Mese-Teller', '10', 'buntes, mediterranes Gemüse, goldbraun panierter Käse', '16,90'),
     ('09', 'Panierter Schafskäse', '10', 'mit Oliven & Peperoni', '9,90'),
     ('10', 'Gebackener Fetakäse', None, 'mit frischen Tomaten und Zwiebeln', '9,90'),
   ]),
 ]),
 ('m-salate', 'Salate', [
   ('Frische Salate mit Joghurtdressing', None, None, [
     ('12', 'Adria Salat', None, 'Gemischter Salat mit Hähnchenstreifen oder Gyros', '15,90'),
     ('13', 'Schopska Salat', None, 'Gemischter Salat mit geriebenem Fetakäse', '14,90'),
     ('14', 'Salat des Hauses', None, 'Gemischter Salat mit Thunfisch', '15,90'),
   ]),
 ]),
 ('m-grill', 'Vom Grill', [
   ('Spezialitäten vom Grill', None, NOTE_FULL, [
     ('17', 'Cevapcici', None, 'Hackfleischröllchen mit frischen Zwiebeln, dazu Pommes', '19,90'),
     ('18', 'Pljeskavica', None, 'Saftiges Hacksteak mit Feta oder Gouda gefüllt, dazu Pommes', '19,90'),
     ('19', 'Pljeskavica in Metaxa Sauce', None, 'Saftiges Hacksteak mit Feta gefüllt, dazu Pommes', '20,90'),
     ('20', 'Balkanleber „nach Bauern Art“', None, 'gegrillte Leber mit gebratenen Zwiebeln und Paprika, dazu Wedges', '19,90'),
     ('21', 'Rinderleber in Metaxasauce', None, 'gegrillte Leber, dazu Pommes', '19,90'),
     ('22', 'Raznjici', None, 'Fleischspieße, dazu Pommes', '19,90'),
     ('23', 'Fleischspieße „nach Bauern Art“', None, 'Fleischspieße mit gerösteten Zwiebeln und Paprika, dazu Wedges', '20,90'),
     ('24', 'Fleischspieße „Metaxa“', None, 'Fleischspieße mit Metaxa Sauce, dazu Pommes', '20,90'),
     ('25', 'Hähnchenbrustfilet „Metaxa“', None, 'Metaxa Sauce, dazu Pommes', '21,90'),
     ('31', 'Gegrilltes Hähnchenbrustfilet', None, 'dazu Pommes', '19,90'),
     ('34', 'Lammkotelett', None, 'dazu Pommes', '24,90'),
   ]),
 ]),
 ('m-gyros', 'Gyros & Platten', [
   ('Gyros Spezialitäten', None, NOTE, [
     ('35', 'Gyros', None, 'dazu Pommes', '17,90'),
     ('36', 'Gyros in Metaxasauce', None, 'mit Käse überbacken, dazu Pommes', '19,90'),
     ('38', 'Gyros mit gerösteten Zwiebeln und Paprika', None, 'dazu Wedges', '20,90'),
     ('39', 'Gyros und Raznjici', None, 'dazu Pommes', '21,90'),
   ]),
   ('Für den großen Hunger', None, NOTE, [
     ('44', 'Adria Teller', None, 'Raznjici, Pljeskavica, Leber, Gyros, dazu Djuvec Reis und Pommes', '22,90'),
     ('45', 'Dubrovnik Teller', None, 'Cevapcici, Lammkotelett, Hähnchenfilet, Gyros, dazu Djuvec Reis und Pommes', '23,90'),
     ('46', 'Pola-Pola', None, 'Fleischspieß & 5 Cevapcici, dazu Djuvec Reis und Pommes', '21,90'),
   ]),
   ('Party Platten', None, NOTE, [
     ('62', 'Jadran-Gourmet Platte', '1,9', 'Panierte Schnitzel, Gyros, Lammkotelett, Cevapcici, Pljeskavica, dazu Wedges, Djuvec Reis & Schopska Salat', '25,90 € pro Person'),
   ]),
 ]),
 ('m-schnitzel', 'Schnitzel & Backofen', [
   ('Schnitzel', None, NOTE, [
     ('1003', 'Cordon Bleu', 'c', 'Paniertes Hähnchenschnitzel gefüllt mit Käse und Schinken, auf Sauce Hollandaise, dazu Pommes', '21,90'),
     ('51', 'Paniertes Hähnchenschnitzel', 'c', 'dazu Pommes', '19,90'),
   ]),
   ('Spezialitäten aus dem Backofen', None, NOTE_SMALL, [
     ('65', 'Hähnchenbrustfilet', '9', 'überbacken mit Sauce Hollandaise, dazu Grillgemüse & Djuvec Reis', '21,90'),
     ('66', 'Mix Pfanne', '9', 'Feine Rinder- und Hähnchenbrust, überbacken mit Sauce Hollandaise, dazu Grillgemüse & Wedges', '23,90'),
   ]),
 ]),
 ('m-fisch', 'Fisch & Steaks', [
   ('Fischspezialitäten', None, NOTE, [
     ('54', 'Calamares', 'd', 'paniert oder gegrillt, dazu frisches Grillgemüse und Pommes', '22,90'),
     ('55', 'Gegrillte Garnelenspieße', 'b', 'auf Grillgemüse & Knoblauchmarinade, dazu Pommes', '23,90'),
     ('555', 'Gegrillter Lachs', 'd', 'auf Grillgemüse, dazu Wedges', '23,90'),
     ('53', 'Fischteller', 'd', 'Garnelen, Lachs, gegrillter Calamares, dazu Grillgemüse & Wedges', '29,90'),
   ]),
   ('Steaks', None, NOTE, [
     ('56', 'Rumpsteak', '3', 'dazu Wedges und Kräuterbutter', '28,90'),
     ('57', 'Rumpsteak in Metaxa', '3', 'dazu Wedges', '29,90'),
     ('58', 'Rumpsteak mit gerösteten Zwiebeln und Champignons', '3', 'dazu Wedges und Kräuterbutter', '29,90'),
   ]),
 ]),
 ('m-pizza', 'Pizza', [
   ('Pizza aus dem Steinofen', None, NOTE_SMALL, [
     ('51', 'Pizza Margherita', None, 'mit Tomatensauce und Mozzarella', '12,90'),
     ('52', 'Pizza Salami', None, 'mit Tomatensauce, Mozzarella und Salami', '14,90'),
     ('53', 'Pizza Tuna', None, 'mit Thunfisch und Zwiebeln', '15,90'),
     ('54', 'Pizza Vegetaria', None, 'mit Grillgemüse', '15,90'),
     ('55', 'Pizza Gyros', None, 'mit Gyros Fleisch', '16,90'),
   ]),
 ]),
 ('m-kinder', 'Kinder & Beilagen', [
   ('Für unsere kleinen Gäste', 'bis 14 Jahre', None, [
     ('70', 'Mini Gyros', None, 'dazu Pommes', '9,90'),
     ('71', 'Chicken Nuggets', None, 'dazu Pommes', '9,90'),
     ('58', 'Mini Pljeskavica', None, 'Hacksteak, dazu Pommes', '9,90'),
   ]),
   ('Beilagen', None, None, [
     ('74', 'Pommes', None, None, '3,90'),
     ('75', 'Djuvec Reis', None, None, '3,90'),
     ('76', 'Brot', '1', None, '2,00'),
     ('77', 'Wedges', None, None, '3,90'),
     ('80', 'Metaxa- oder Rahmsauce', '9,6', None, '3,00'),
   ]),
 ]),
 ('m-dessert', 'Dessert', [
   ('Dessert', None, None, [
     (None, 'Schokoladensoufflé mit flüssigem Kern', None, None, '7,90'),
     (None, 'Tartufo', None, None, '7,90'),
     (None, 'Eisbecher', None, '3 Kugeln, Sahne', '5,90'),
     (None, 'Palacinke mit Schokocreme', None, None, '7,90'),
   ]),
 ]),
]

e = html.escape
I = ' ' * 20


def price(p):
    return e(p) if '€' in p else e(p) + ' €'


def item_html(no, name, codes, desc, pr, ind):
    no_html = f'<span class="menu-item-no">{e(no)}.</span> ' if no else ''
    codes_html = f' <sup class="menu-item-codes" title="Kennzeichnung (Zusatzstoffe / Allergene)">{e(codes)}</sup>' if codes else ''
    desc_html = f'\n{ind}    <p class="menu-item-desc">{e(desc)}</p>' if desc else ''
    return (f'{ind}<li class="menu-item">\n'
            f'{ind}    <div class="menu-item-head">\n'
            f'{ind}        <h4 class="menu-item-name">{no_html}{e(name)}{codes_html}</h4>\n'
            f'{ind}        <span class="menu-item-dots" aria-hidden="true"></span>\n'
            f'{ind}        <span class="menu-item-price">{price(pr)}</span>\n'
            f'{ind}    </div>{desc_html}\n'
            f'{ind}</li>')


out = []
out.append(f'''{I}<div class="menu-tabs">
{I}    <ul class="nav menu-nav" role="tablist">''')
for i, (tid, label, _) in enumerate(MENU):
    act = ' class="active"' if i == 0 else ''
    sel = 'true' if i == 0 else 'false'
    out.append(f'{I}        <li role="presentation"{act}><a href="#{tid}" aria-controls="{tid}" role="tab" data-toggle="tab" aria-selected="{sel}">{e(label)}</a></li>')
out.append(f'{I}    </ul>')
out.append(f'{I}    <div class="tab-content menu-panes">')
for i, (tid, label, groups) in enumerate(MENU):
    act = ' in active' if i == 0 else ''
    out.append(f'{I}        <div role="tabpanel" class="tab-pane fade{act}" id="{tid}">')
    for title, sub, note, items in groups:
        out.append(f'{I}            <div class="menu-group">')
        out.append(f'{I}                <h3 class="menu-group-title">{e(title)}</h3>')
        if sub:
            out.append(f'{I}                <p class="menu-group-sub">{e(sub)}</p>')
        out.append(f'{I}                <ul class="menu-list">')
        for it in items:
            out.append(item_html(*it, ind=I + ' ' * 20))
        out.append(f'{I}                </ul>')
        if note:
            out.append(f'{I}                <p class="menu-group-note">{e(note)}</p>')
        out.append(f'{I}            </div>')
    out.append(f'{I}        </div>')
out.append(f'{I}    </div>')
out.append(f'''{I}    <p class="menu-legend">Die hochgestellten Zahlen und Buchstaben kennzeichnen Zusatzstoffe und Allergene.
{I}        Eine Übersicht erhalten Sie gerne bei unserem Personal. Alle Preise in Euro inkl. MwSt.</p>
{I}</div>
{I}<div class="tab-menu">
{I}    <a href="images/Menu.pdf" download="Speisekarte-Porto-Adria.pdf" aria-label="Speisekarte als PDF herunterladen">Speisekarte als PDF</a>
{I}</div>''')
block = '\n'.join(out)

section = f'''    <div id="menu" class="menu-main pad-top-100 pad-bottom-100">
        <div class="container">
            <div class="row">
                <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <div class="wow fadeIn" data-wow-duration="1s" data-wow-delay="0.1s">
                        <h2 class="block-title text-center">
                            Unsere Speisekarte
                        </h2>
                        <p class="title-caption text-center">
                            Frisch zubereitet mit dem Geschmack des Balkans. Wählen Sie eine Kategorie:
                        </p>
                    </div>
{block}
                </div>
                <!-- end col -->
            </div>
            <!-- end row -->
        </div>
        <!-- end container -->
    </div>
'''

p = sys.argv[1]
s = open(p, encoding='utf-8', newline='').read()
a = s.index('    <div id="menu" class="menu-main')
b = s.index('    <!-- end menu -->')
s = s[:a] + section.replace('\n', '\r\n') + s[b:]
open(p, 'w', encoding='utf-8', newline='').write(s)
n = sum(len(g[3]) for t in MENU for g in t[2])
print('menu injected:', len(MENU), 'tabs,', sum(len(t[2]) for t in MENU), 'groups,', n, 'items')
