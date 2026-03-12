.PHONY: apply delete destroy restart env build remove nuke

build:
	docker build -t youcube:dev .
	docker system prune -f

env:
	kubectl create configmap youcube-config --from-env-file=backend/.env.local --dry-run=client -o yaml > k8s/cm.yaml
	
apply:
	kubectl apply -f k8s/

delete:
	kubectl delete deployment -l "app in (fastapi, celery, flower, nextjs)" -n prod-youcube
	kubectl get rs -n prod-youcube -o json | \
	jq -r '.items[] | select(.spec.replicas == 0) | .metadata.name' | \
	xargs -I {} kubectl delete rs {} -n prod-youcube

remove:
	kubectl delete -f k8s/

restart:
	kubectl rollout restart deployment/fastapi -n prod-youcube
	kubectl rollout restart deployment/celery -n prod-youcube
	kubectl rollout restart deployment/flower -n prod-youcube
	kubectl rollout restart deployment/nextjs -n prod-youcube

nuke:
	@echo "Are you sure? This will delete the entire prod-youcube namespace."
	@read -p "Press enter to continue or Ctrl+C to cancel..." && kubectl delete namespace prod-youcube