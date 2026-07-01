package middleware

import (
	"context"
	"strings"

	"github.com/eviltomorrow/personal-service/lib/auth"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

const (
	authorizationKey = "authorization"
	bearerPrefix     = "Bearer "
)

func UnaryServerAuthInterceptor(skipper func(ctx context.Context, fullMethod string) bool) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
		if skipper != nil && skipper(ctx, info.FullMethod) {
			return handler(ctx, req)
		}

		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "missing metadata")
		}

		vals := md.Get(authorizationKey)
		if len(vals) == 0 {
			return nil, status.Error(codes.Unauthenticated, "missing authorization header")
		}

		tokenStr, ok := strings.CutPrefix(vals[0], bearerPrefix)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "invalid authorization format, expected: Bearer <token>")
		}

		claims, err := auth.JwtWithParseToken(tokenStr, nil)
		if err != nil {
			zlog.Info("gRPC auth interceptor: parse token failure", zap.Error(err))
			if err == auth.ErrTokenExpired {
				return nil, status.Error(codes.Unauthenticated, "token is expired")
			}
			return nil, status.Error(codes.Unauthenticated, "invalid token")
		}

		ok, err = auth.StateTokenWithExists(ctx, tokenStr)
		if err != nil {
			zlog.Error("gRPC auth interceptor: check state token failure", zap.Error(err))
			return nil, status.Error(codes.Internal, "internal server error")
		}
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "token is revoked")
		}

		ctx = auth.WithAccountID(ctx, claims.AccountId)
		return handler(ctx, req)
	}
}
