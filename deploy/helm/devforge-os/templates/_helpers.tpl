{{- define "devforge-os.labels" -}}
app.kubernetes.io/name: devforge-os
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}

{{- define "devforge-os.secretName" -}}
{{- if .Values.ai.existingSecret -}}
{{- .Values.ai.existingSecret -}}
{{- else -}}
devforge-secrets
{{- end -}}
{{- end -}}

{{- define "devforge-os.controlPlaneUrl" -}}
http://devforge-control-plane.{{ .Release.Namespace }}.svc.cluster.local:{{ .Values.controlPlane.service.port }}
{{- end -}}
