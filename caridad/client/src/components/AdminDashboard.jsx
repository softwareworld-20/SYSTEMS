import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Avatar,
} from "@mui/material";
import {
  BlockRounded,
  HandshakeRounded,
  PendingActionsRounded,
  PublicRounded,
  TrendingUpRounded,
} from "@mui/icons-material";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";

const COLORS = {
  green: "#0e872c",
  greenSoft: "#79ff9b",
  teal: "#1d9e5b",
  amber: "#c47c12",
  rose: "#a33a4d",
  lavender: "#e7d8dc",
};

const STAT_CARDS = [
  {
    key: "pendiente",
    label: "Por revisar",
    hint: "Pendientes de aceptar",
    icon: PendingActionsRounded,
    color: "#c47c12",
    background: "#fdf0d7",
  },
  {
    key: "publicada",
    label: "Publicadas",
    hint: "Visibles en el muro",
    icon: PublicRounded,
    color: "#0e872c",
    background: "#e1f8e7",
  },
  {
    key: "rechazada",
    label: "Rechazadas",
    hint: "No se muestran",
    icon: BlockRounded,
    color: "#a33a4d",
    background: "#f3e1e4",
  },
];

function ChartCard({ title, subtitle, children }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography
          component="h3"
          sx={{ fontFamily: '"DM Serif Display", serif', fontSize: 21 }}
        >
          {title}
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 12.5, mb: 1.5 }}>
          {subtitle}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function ChartEmpty() {
  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        height: 250,
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 3,
        color: "text.secondary",
        fontSize: 13,
        textAlign: "center",
        px: 2,
      }}
    >
      Todavía no hay solicitudes para mostrar en esta gráfica.
    </Box>
  );
}

export default function AdminDashboard({ stats, requests, categories }) {
  const total = stats?.total ?? requests.length;

  const statusChart = useMemo(() => {
    const byStatus = stats?.byStatus ?? {};
    return {
      labels: ["Abiertas", "En proceso", "Resueltas"],
      values: [
        byStatus.abierta ?? 0,
        byStatus.en_proceso ?? 0,
        byStatus.resuelta ?? 0,
      ],
    };
  }, [stats]);

  const typeChart = useMemo(() => {
    const byType = stats?.byType ?? {};
    return [
      {
        id: "necesito",
        label: "Necesito ayuda",
        value: byType.necesito ?? 0,
        color: COLORS.green,
      },
      {
        id: "ofrezco",
        label: "Ofrezco ayuda",
        value: byType.ofrezco ?? 0,
        color: COLORS.greenSoft,
      },
    ];
  }, [stats]);

  const categoryChart = useMemo(() => {
    const counts = new Map();
    for (const request of requests) {
      counts.set(request.category, (counts.get(request.category) ?? 0) + 1);
    }

    const labelsById = new Map(
      categories.map((category) => [category.id, category.label]),
    );

    const rows = [...counts.entries()]
      .map(([id, value]) => ({
        label: labelsById.get(id) ?? id,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      labels: rows.map((row) => row.label),
      values: rows.map((row) => row.value),
    };
  }, [requests, categories]);

  const activityChart = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(day.getDate() - offset);
      days.push({
        key: day.toISOString().slice(0, 10),
        label: day.toLocaleDateString("es-ES", {
          weekday: "short",
          day: "numeric",
        }),
        value: 0,
      });
    }

    const byDay = new Map(days.map((day) => [day.key, day]));
    for (const request of requests) {
      const key = String(request.createdAt ?? "").slice(0, 10);
      const day = byDay.get(key);
      if (day) day.value += 1;
    }

    return {
      labels: days.map((day) => day.label),
      values: days.map((day) => day.value),
    };
  }, [requests]);

  const offers = stats?.offers ?? 0;
  const published = stats?.byModeration?.publicada ?? 0;

  return (
    <section className="admin-dashboard" aria-label="Dashboard de administración">
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 2,
          mb: 2.5,
        }}
      >
        {STAT_CARDS.map((card) => {
          const value = stats?.byModeration?.[card.key] ?? 0;
          const Icon = card.icon;
          return (
            <Card key={card.key} variant="outlined">
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                >
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                    }}
                  >
                    {card.label}
                  </Typography>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: card.background,
                      color: card.color,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Avatar>
                </Stack>
                <Typography
                  sx={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: 38,
                    lineHeight: 1.1,
                    mt: 1,
                  }}
                >
                  {value}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                  {card.hint}
                </Typography>
              </CardContent>
            </Card>
          );
        })}

        <Card variant="outlined">
          <CardContent sx={{ p: 2.5 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={1}
            >
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                }}
              >
                Respuestas
              </Typography>
              <Avatar
                variant="rounded"
                sx={{ width: 36, height: 36, bgcolor: "#e4fbea", color: "#1d9e5b" }}
              >
                <HandshakeRounded fontSize="small" />
              </Avatar>
            </Stack>
            <Typography
              sx={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 38,
                lineHeight: 1.1,
                mt: 1,
              }}
            >
              {offers}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
              Ayudas ofrecidas por la comunidad
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <ChartCard
          title="Estado de las solicitudes"
          subtitle="Solicitudes abiertas, en proceso y resueltas."
        >
          {total === 0 ? (
            <ChartEmpty />
          ) : (
            <BarChart
              height={260}
              series={[
                {
                  data: statusChart.values,
                  label: "Solicitudes",
                  color: COLORS.green,
                },
              ]}
              xAxis={[
                {
                  scaleType: "band",
                  data: statusChart.labels,
                  tickLabelStyle: { fontSize: 11 },
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ top: 10, right: 12, bottom: 30, left: 40 }}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Tipo de publicación"
          subtitle="Reparto entre necesidades y ayudas ofrecidas."
        >
          {total === 0 ? (
            <ChartEmpty />
          ) : (
            <PieChart
              height={260}
              series={[
                {
                  data: typeChart,
                  innerRadius: 58,
                  paddingAngle: 2,
                  cornerRadius: 5,
                  highlightScope: { faded: "global", highlighted: "item" },
                },
              ]}
              margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Actividad de los últimos 7 días"
          subtitle="Solicitudes recibidas cada día, estén publicadas o no."
        >
          {total === 0 ? (
            <ChartEmpty />
          ) : (
            <LineChart
              height={260}
              series={[
                {
                  data: activityChart.values,
                  label: "Solicitudes",
                  color: COLORS.green,
                  area: true,
                  curve: "monotoneX",
                },
              ]}
              xAxis={[
                {
                  scaleType: "point",
                  data: activityChart.labels,
                  tickLabelStyle: { fontSize: 11 },
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ top: 10, right: 16, bottom: 30, left: 40 }}
            />
          )}
        </ChartCard>

        <ChartCard
          title="Solicitudes por categoría"
          subtitle="Las seis categorías con más actividad."
        >
          {total === 0 ? (
            <ChartEmpty />
          ) : (
            <BarChart
              layout="horizontal"
              height={260}
              series={[
                {
                  data: categoryChart.values,
                  label: "Solicitudes",
                  color: COLORS.teal,
                },
              ]}
              yAxis={[
                {
                  scaleType: "band",
                  data: categoryChart.labels,
                  tickLabelStyle: { fontSize: 11 },
                },
              ]}
              grid={{ vertical: true }}
              margin={{ top: 10, right: 16, bottom: 26, left: 118 }}
            />
          )}
        </ChartCard>
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        <TrendingUpRounded fontSize="small" sx={{ color: COLORS.green }} />
        <Typography sx={{ fontSize: 13 }}>
          {published} solicitudes publicadas de {total} recibidas.
        </Typography>
      </Stack>
    </section>
  );
}
