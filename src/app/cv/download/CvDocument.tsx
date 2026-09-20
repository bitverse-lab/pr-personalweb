import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Profile } from "@/lib/data/profile";

// Plain single-column layout on purpose: it reads cleanly and parses well in applicant tracking systems.
const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 40, paddingHorizontal: 44, fontSize: 10, fontFamily: "Helvetica", color: "#1f2937", lineHeight: 1.4 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  headline: { fontSize: 11, color: "#2a52c3", marginTop: 2 },
  contact: { fontSize: 9, color: "#4b5563", marginTop: 6 },
  section: { marginTop: 14 },
  heading: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#2a52c3", textTransform: "uppercase", letterSpacing: 0.8, borderBottomWidth: 0.75, borderBottomColor: "#d1d5db", paddingBottom: 3, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: "#6b7280" },
  item: { marginBottom: 8 },
  bullet: { flexDirection: "row", marginTop: 2 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
  skills: { flexDirection: "row", flexWrap: "wrap" },
});

const Bullet = ({ text }: { text: string }) => (
  <View style={styles.bullet} wrap={false}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

export default function CvDocument({ profile }: { profile: Profile }) {
  const contact = [profile.location, profile.email, profile.website?.replace(/^https?:\/\//, "")].filter(Boolean).join("  |  ");
  const skillGroups = profile.skills.map((s) => s.label).join("  •  ");

  return (
    <Document title={`${profile.fullName} — CV`} author={profile.fullName}>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{profile.fullName}</Text>
          {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
          {contact ? <Text style={styles.contact}>{contact}</Text> : null}
          {profile.links.length > 0 && (
            <View style={[styles.skills, { marginTop: 2 }]}>
              {profile.links.map((l, i) => (
                <Text key={l.url} style={styles.contact}>
                  <Link src={l.url} style={{ color: "#4b5563" }}>{l.label}</Link>
                  {i < profile.links.length - 1 ? "  |  " : ""}
                </Text>
              ))}
            </View>
          )}
        </View>

        {profile.summary ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Summary</Text>
            <Text>{profile.summary}</Text>
          </View>
        ) : null}

        {profile.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Experience</Text>
            {profile.experience.map((e, i) => (
              <View key={`${e.company}-${i}`} style={styles.item} wrap={false}>
                <View style={styles.row}>
                  <Text style={styles.bold}>{e.role}</Text>
                  <Text style={styles.muted}>{e.period}</Text>
                </View>
                <Text style={styles.muted}>{[e.company, e.location].filter(Boolean).join(" · ")}</Text>
                {e.description ? <Text style={{ marginTop: 3 }}>{e.description}</Text> : null}
                {(e.achievements ?? []).map((a) => (
                  <Bullet key={a} text={a} />
                ))}
              </View>
            ))}
          </View>
        )}

        {profile.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Education</Text>
            {profile.education.map((e, i) => (
              <View key={`${e.school}-${i}`} style={styles.item} wrap={false}>
                <View style={styles.row}>
                  <Text style={styles.bold}>{e.school}</Text>
                  <Text style={styles.muted}>{e.period}</Text>
                </View>
                {e.detail ? <Text>{e.detail}</Text> : null}
                {e.description ? <Text style={styles.muted}>{e.description}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {profile.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Projects</Text>
            {profile.projects.map((p) => (
              <View key={p.slug} style={styles.item} wrap={false}>
                <View style={styles.row}>
                  <Text style={styles.bold}>{p.title}</Text>
                  {p.role ? <Text style={styles.muted}>{p.role}</Text> : null}
                </View>
                {p.summary ? <Text>{p.summary}</Text> : null}
                {p.technologies.length > 0 ? <Text style={styles.muted}>{p.technologies.join(", ")}</Text> : null}
                {p.url ? (
                  <Link src={p.url} style={{ color: "#2a52c3", fontSize: 9 }}>
                    {p.url.replace(/^https?:\/\//, "")}
                  </Link>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {skillGroups ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Skills</Text>
            <Text>{skillGroups}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
